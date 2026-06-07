import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { FaHome, FaPhoneAlt, FaDatabase, FaWifi, FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';
import Dashboard from './pages/Dashboard';
import MakeCalls from './pages/MakeCalls';
import Attendance from './pages/Attendance';
import Login from './pages/Login';

const BACKEND_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (window.location.port === '5173'
      ? `http://${window.location.hostname}:5000` // Local Wi-Fi testing (phone loads PC backend)
      : window.location.origin);

export default function App() {
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || '');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [callLogs, setCallLogs] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  const [whatsappConfig, setWhatsappConfig] = useState({ template: '', greetings: [] });

  // 1. Fetch initial registrations and call logs
  const fetchData = async () => {
    if (!adminId) return;
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

      const configRes = await fetch(`${BACKEND_URL}/api/whatsapp-config`);
      const configData = await configRes.json();
      if (configData && configData.template) {
        setWhatsappConfig(configData);
      }
    } catch (error) {
      console.error('Error fetching initial database records:', error);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    if (!adminId) {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocketInstance(null);
      }
      setIsConnected(false);
      return;
    }

    fetchData();

    // 2. Setup Socket.io real-time connection
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    setSocketInstance(socket);

    socket.on('connect', () => {
      if (!isCurrent) return;
      console.log('Connected to real-time server');
      setIsConnected(true);
      
      // Register Admin Session with the Backend on Connection
      socket.emit('session:register', { adminId });
    });

    socket.on('disconnect', () => {
      if (!isCurrent) return;
      console.log('Disconnected from real-time server');
      setIsConnected(false);
    });

    // Listen for WebSocket concurrency error (e.g. seat taken)
    socket.on('session:error', (data) => {
      if (!isCurrent) return;
      console.error('Session error:', data.error);
      setLoginError(data.error || 'Session terminated due to another login.');
      handleLogout();
    });

    // Receive student registration updates (e.g. from change stream or polling backend)
    socket.on('students:update', (updatedStudents) => {
      if (!isCurrent) return;
      console.log('Received real-time student updates:', updatedStudents.length);
      if (Array.isArray(updatedStudents)) {
        setStudents(updatedStudents);
      }
    });

    // Receive call logged confirmations in real-time
    socket.on('call:confirmed', (newCallLog) => {
      if (!isCurrent) return;
      console.log('Real-time call confirmation received for:', newCallLog.whatsappNumber);
      setCallLogs(prevLogs => ({
        ...prevLogs,
        [newCallLog.whatsappNumber]: newCallLog
      }));
    });

    return () => {
      isCurrent = false;
      socket.disconnect();
    };
  }, [adminId]);

  const handleLoginSuccess = (id) => {
    localStorage.setItem('adminId', id);
    setAdminId(id);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    setAdminId('');
    if (socketInstance) {
      socketInstance.disconnect();
      setSocketInstance(null);
    }
    setIsConnected(false);
  };

  // 3. Confirm call handler
  const handleConfirmCall = (whatsappNumber, participationConfirmed) => {
    if (!socketInstance) return;

    // Optimistic UI update
    setCallLogs(prevLogs => ({
      ...prevLogs,
      [whatsappNumber]: { 
        whatsappNumber, 
        callTaken: true, 
        participationConfirmed, 
        calledAt: new Date().toISOString() 
      }
    }));

    // Emit confirmation event to server
    socketInstance.emit('call:confirm', { whatsappNumber, participationConfirmed });
  };

  // Render Login screen if not authenticated
  if (!adminId) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        errorMsg={loginError} 
        setErrorMsg={setLoginError} 
        BACKEND_URL={BACKEND_URL} 
      />
    );
  }

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

        {/* Live sync badge & Admin logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="connection-status" style={{ marginTop: 0 }}>
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
          
          <div className="connection-status" style={{ marginTop: 0, gap: '0.75rem', paddingRight: '0.5rem' }}>
            <span>Admin: <strong style={{ textTransform: 'capitalize' }}>{adminId}</strong></span>
            <button className="btn-logout" onClick={handleLogout}>
              <FaSignOutAlt size={11} /> Logout
            </button>
          </div>
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
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <FaCalendarAlt size={13} /> Attendance Tracker
        </button>
      </nav>

      {/* Main Pages Content */}
      <main>
        {activeTab === 'home' ? (
          <Dashboard students={students} />
        ) : activeTab === 'calls' ? (
          <MakeCalls
            students={students}
            callLogs={callLogs}
            onConfirmCall={handleConfirmCall}
            adminId={adminId}
            whatsappConfig={whatsappConfig}
          />
        ) : (
          <Attendance students={students} />
        )}
      </main>
    </div>
  );
}

