import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Student, { StudentSme25 } from './models/Student.js';
import CallLog from './models/CallLog.js';
import { primaryConnection, secondaryConnection } from './config.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Admin Session Tracking
const activeAdminSessions = new Map(); // adminId (lowercase) -> socket.id

// Helper function to look up student fields for secondary DB logging
async function getStudentFields(whatsappNumber) {
  try {
    let student = await Student.findOne({
      $or: [
        { "WhatsApp Number": whatsappNumber },
        { "Whatsapp Number": whatsappNumber }
      ]
    });
    if (!student) {
      student = await StudentSme25.findOne({
        $and: [
          {
            $or: [
              { "WhatsApp Number": whatsappNumber },
              { "Whatsapp Number": whatsappNumber }
            ]
          },
          {
            $or: [
              { exam_center_confirmed26: true },
              { exam_center_confirmed26: "true" },
              { exam_center_confirmed26: " true" }
            ]
          }
        ]
      });
    }
    if (student) {
      return {
        firstName: student["First Name"],
        lastName: student["Last Name"],
        examCenter: student["final_exam_center"],
        nic: student["NIC"],
        studentId: student._id ? student._id.toString() : undefined
      };
    }
  } catch (err) {
    console.error("Error looking up student for secondary database:", err.message);
  }
  return {};
}

// API Routes
app.post('/api/login', (req, res) => {
  const { adminId } = req.body;
  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID is required.' });
  }

  // Parse allowed admin IDs from env
  const permittedIds = (process.env.ADMIN_IDS || 'verosha@123, chethana@123, hansani@123, vidul@123, seniru@123, senuka@123, amiru@123, sanithu@123, admin@malabe, admin@colpetty, admin@ampara, admin@kandy, admin@kalutara, admin@matara, admin@ratnapura, admin2@malabe, admin2@colpetty, admin2@ampara, admin2@kandy, admin2@kalutara, admin2@matara, admin2@ratnapura')
    .split(',')
    .map(id => id.trim().toLowerCase());

  const normalizedId = adminId.trim().toLowerCase();

  if (!permittedIds.includes(normalizedId)) {
    return res.status(401).json({ error: 'Invalid Admin ID.' });
  }

  // Concurrency Check: Check if this Admin ID is currently active in another session
  const existingSocketId = activeAdminSessions.get(normalizedId);
  if (existingSocketId) {
    const activeSocket = io.sockets.sockets.get(existingSocketId);
    if (activeSocket && activeSocket.connected) {
      return res.status(403).json({ error: 'This Admin ID is currently active in another session.' });
    } else {
      // Clean up stale session
      activeAdminSessions.delete(normalizedId);
    }
  }

  res.json({ success: true, adminId: normalizedId });
});

app.get('/api/students', async (req, res) => {
  try {
    const students26 = await Student.find();
    const students25 = await StudentSme25.find({
      $or: [
        { exam_center_confirmed26: true },
        { exam_center_confirmed26: "true" },
        { exam_center_confirmed26: " true" }
      ]
    });
    res.json([...students26, ...students25]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/calls', async (req, res) => {
  try {
    const logs = await CallLog.find();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/whatsapp-config', (req, res) => {
  const defaultTemplate = `{greeting} {firstName}, අපි සස්නක සංසදයෙන්. ඔයා අපේ mock exam එකට register වෙලා ඉන්නවානේ.\n\nකොළඹ, නුවර, කුරුණෑගල, මාතර, කළුතර centers වල හෙට තියෙන්නේ {paper}. මේ exam එක සම්පූ+ර්+ණ+යෙන්ම නොමිලේ කරන්නේ. ඔයා අද එකට ආවත් නැතත් subject wise z score එකක් ලැබෙන නිසා ඔයාලාට ඒක වටීවි\n\nඔයා හෙට එයි කියලා අපි බලාපොරොත්තු වෙනවා.\n🌞💛`;
  const defaultGreetings = 'Hi,Hello';
  const defaultCenterPapers = {
    "default": "Biology සහ Combined Mathematics"
  };

  const template = process.env.WHATSAPP_MESSAGE_TEMPLATE || defaultTemplate;
  const greetingsStr = process.env.WHATSAPP_GREETINGS || defaultGreetings;
  const greetings = greetingsStr.split(',').map(g => g.trim()).filter(Boolean);

  let centerPapers = defaultCenterPapers;
  if (process.env.WHATSAPP_CENTER_PAPERS) {
    try {
      centerPapers = JSON.parse(process.env.WHATSAPP_CENTER_PAPERS);
    } catch (e) {
      console.error("Error parsing WHATSAPP_CENTER_PAPERS env var:", e.message);
    }
  }

  res.json({ template, greetings, centerPapers });
});

app.post('/api/calls', async (req, res) => {
  const { whatsappNumber, participationConfirmed } = req.body;
  if (!whatsappNumber) {
    return res.status(400).json({ error: 'whatsappNumber is required' });
  }
  try {
    const studentFields = await getStudentFields(whatsappNumber);
    const log = await CallLog.findOneAndUpdate(
      { whatsappNumber },
      {
        callTaken: true,
        calledAt: new Date(),
        participationConfirmed,
        ...studentFields
      },
      { upsert: true, new: true }
    );
    io.emit('call:confirmed', log);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket Event Listeners
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Register Admin Session on Connection
  socket.on('session:register', (data) => {
    const { adminId } = data;
    if (!adminId) return;

    const normalizedId = adminId.trim().toLowerCase();

    // Check if another socket had registered this adminId
    const previousSocketId = activeAdminSessions.get(normalizedId);
    if (previousSocketId && previousSocketId !== socket.id) {
      const activeSocket = io.sockets.sockets.get(previousSocketId);
      if (activeSocket && activeSocket.connected) {
        // If there's an active session on another socket, disconnect the new socket
        socket.emit('session:error', { error: 'Admin ID is already active elsewhere.' });
        socket.disconnect();
        return;
      }
    }

    activeAdminSessions.set(normalizedId, socket.id);
    socket.adminId = normalizedId;
    console.log(`Registered active session: Admin "${normalizedId}" on socket ${socket.id}`);
  });

  socket.on('call:confirm', async (data) => {
    const { whatsappNumber, participationConfirmed } = data;
    try {
      const studentFields = await getStudentFields(whatsappNumber);
      const log = await CallLog.findOneAndUpdate(
        { whatsappNumber },
        {
          callTaken: true,
          calledAt: new Date(),
          participationConfirmed,
          ...studentFields
        },
        { upsert: true, new: true }
      );
      io.emit('call:confirmed', log);
      console.log(`Call confirmed for: ${whatsappNumber} (Participation: ${participationConfirmed}) via WebSocket`);
    } catch (error) {
      console.error('Error confirming call via WebSocket:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.adminId) {
      // Clear session seat if this socket held the active session
      if (activeAdminSessions.get(socket.adminId) === socket.id) {
        activeAdminSessions.delete(socket.adminId);
        console.log(`Cleared active session: Admin "${socket.adminId}" disconnected.`);
      }
    }
  });
});

// Serving Compiled Frontend Assets in Production (Railway)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../frontend/dist');

app.use(express.static(distPath));

// For Single Page Application Routing
app.get('*', (req, res, next) => {
  // Pass API calls to Express routing
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server is running. Frontend build was not found (development mode).');
    }
  });
});

// Database Change Streams & Polling fallback
let studentCount = 0;

const getCombinedStudents = async () => {
  const students26 = await Student.find();
  const students25 = await StudentSme25.find({
    $or: [
      { exam_center_confirmed26: true },
      { exam_center_confirmed26: "true" },
      { exam_center_confirmed26: " true" }
    ]
  });
  return [...students26, ...students25];
};

const getCombinedCount = async () => {
  const count26 = await Student.countDocuments();
  const count25 = await StudentSme25.countDocuments({
    $or: [
      { exam_center_confirmed26: true },
      { exam_center_confirmed26: "true" },
      { exam_center_confirmed26: " true" }
    ]
  });
  return count26 + count25;
};

try {
  if (primaryConnection.readyState === 1) {
    studentCount = await getCombinedCount();
  }
} catch (err) {
  // Settle quietly
}

const setupChangeStreams = async () => {
  try {
    if (primaryConnection.readyState !== 1) return;
    studentCount = await getCombinedCount();

    const changeStream26 = Student.watch();
    changeStream26.on('change', async (change) => {
      console.log('Primary DB sme26registrations Change detected:', change.operationType);
      const combined = await getCombinedStudents();
      io.emit('students:update', combined);
    });

    const changeStream25 = StudentSme25.watch();
    changeStream25.on('change', async (change) => {
      console.log('Primary DB sme25registrations Change detected:', change.operationType);
      const combined = await getCombinedStudents();
      io.emit('students:update', combined);
    });

    console.log('Change Streams successfully initialized.');
  } catch (e) {
    console.log('Change Streams not supported (non-replica set). Setting up polling fallback.');
    startPolling();
  }
};

const startPolling = () => {
  setInterval(async () => {
    try {
      if (primaryConnection.readyState !== 1) return;
      const currentCount = await getCombinedCount();
      if (currentCount !== studentCount) {
        console.log(`Syncing frontend data: registration count changed from ${studentCount} to ${currentCount}.`);
        studentCount = currentCount;
        const combined = await getCombinedStudents();
        io.emit('students:update', combined);
      }
    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }, 5000);
};

// Wait for database connections to settle, then start watcher/polling
setTimeout(setupChangeStreams, 5000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
