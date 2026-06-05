import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { FaHome, FaPhoneAlt, FaDatabase, FaWifi } from 'react-icons/fa';
import Dashboard from './pages/Dashboard';
import MakeCalls from './pages/MakeCalls';

const BACKEND_URL = 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [callLogs, setCallLogs] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);

  // 1. Fetch initial registrations and call logs
  const fetchData = async () => {
    try {
      const studentRes = await fetch(`${BACKEND_URL}/api/students`);
      const studentData = await studentRes.json();
      if (Array.isArray(studentData)) {
        setStudents(studentData);
      }

      const callRes = await fetch(`${BACKEND_URL}/api/calls`);
      const callData = await callRes.json();
      if (Array.isArray(callData)) {
        // Convert to key-value map by whatsappNumber for O(1) lookups
        const logMap = {};
        callData.forEach(log => {
          logMap[log.whatsappNumber] = log;
        });
        setCallLogs(logMap);
      }
    } catch (error) {
      console.error('Error fetching initial database records:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // 2. Setup Socket.io real-time connection
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Connected to real-time server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      setIsConnected(false);
    });

    // Receive student registration updates (e.g. from change stream or polling backend)
    socket.on('students:update', (updatedStudents) => {
      console.log('Received real-time student updates:', updatedStudents.length);
      if (Array.isArray(updatedStudents)) {
        setStudents(updatedStudents);
      }
    });

    // Receive call logged confirmations in real-time
    socket.on('call:confirmed', (newCallLog) => {
      console.log('Real-time call confirmation received for:', newCallLog.whatsappNumber);
      setCallLogs(prevLogs => ({
        ...prevLogs,
        [newCallLog.whatsappNumber]: newCallLog
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Confirm call handler
  const handleConfirmCall = (whatsappNumber) => {
    if (!socketInstance) return;

    // Optimistic UI update
    setCallLogs(prevLogs => ({
      ...prevLogs,
      [whatsappNumber]: { whatsappNumber, callTaken: true, calledAt: new Date().toISOString() }
    }));

    // Emit confirmation event to server
    socketInstance.emit('call:confirm', { whatsappNumber });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>
          <FaDatabase className="text-primary" /> Student Portal Visualizer
        </h1>
        <p>
          Real-time synchronized student dashboard and exam confirmation tracker linked to MongoDB databases.
        </p>

        {/* Live sync badge */}
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <FaWifi /> {isConnected ? 'Live Connected' : 'Offline / Reconnecting'}
          </span>
          {isConnected && (
            <span className="live-indicator">
              <span className="live-dot"></span> Sync Active
            </span>
          )}
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="navigation">
        <button
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <FaHome /> Dashboard Home
        </button>
        <button
          className={`tab-btn ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          <FaPhoneAlt size={13} /> Make Calls Queue
        </button>
      </nav>

      {/* Main Pages Content */}
      <main>
        {activeTab === 'home' ? (
          <Dashboard students={students} />
        ) : (
          <MakeCalls
            students={students}
            callLogs={callLogs}
            onConfirmCall={handleConfirmCall}
          />
        )}
      </main>
    </div>
  );
}
