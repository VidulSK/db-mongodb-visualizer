import { useState } from 'react';
import { FaUsers, FaCheckCircle, FaMapMarkerAlt, FaGlobe, FaDatabase, FaTrashAlt } from 'react-icons/fa';

export default function Dashboard({ students = [], callLogs = {}, onClearDatabase }) {
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeStatus, setWipeStatus] = useState('');

  // 1. Total registrations
  const totalRegistrations = students.length;

  const isConfirmed = (val) => {
    return val === true || val === 'true' || val === ' true' || (typeof val === 'string' && val.trim() === 'true');
  };

  // 2. Total confirmed exam center students (exam_center_confirmed26: true / " true")
  const totalConfirmed = students.filter(s => isConfirmed(s.exam_center_confirmed26)).length;

  // 3. Centerwise student registrations and confirmations
  const centerDataMap = {};

  students.forEach(student => {
    const center = student["final_exam_center"];
    if (center) {
      if (!centerDataMap[center]) {
        centerDataMap[center] = { registrations: 0, confirmations: 0 };
      }
      centerDataMap[center].registrations += 1;
      if (isConfirmed(student.exam_center_confirmed26)) {
        centerDataMap[center].confirmations += 1;
      }
    }
  });

  const centers = Object.keys(centerDataMap).map(name => ({
    name,
    registrations: centerDataMap[name].registrations,
    confirmations: centerDataMap[name].confirmations,
    percentage: centerDataMap[name].registrations > 0
      ? Math.round((centerDataMap[name].confirmations / centerDataMap[name].registrations) * 100)
      : 0
  })).sort((a, b) => b.registrations - a.registrations);

  // 4. Call logging metrics
  const totalCalls = Object.keys(callLogs).length;
  const totalYes = Object.values(callLogs).filter(c => c.participationConfirmed === true).length;
  const totalNo = Object.values(callLogs).filter(c => c.participationConfirmed === false).length;

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    setWipeStatus('Wiping call logs...');
    try {
      const res = await onClearDatabase();
      if (res && res.success) {
        setWipeStatus('Successfully cleared!');
        setTimeout(() => {
          setShowWipeModal(false);
          setWipeStatus('');
          setIsWiping(false);
        }, 1000);
      } else {
        setWipeStatus(`Error: ${res?.error || 'Failed to clear'}`);
        setTimeout(() => {
          setIsWiping(false);
          setWipeStatus('');
        }, 3000);
      }
    } catch (err) {
      setWipeStatus(`Error: ${err.message}`);
      setTimeout(() => {
        setIsWiping(false);
        setWipeStatus('');
      }, 3000);
    }
  };

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-info">
            <h3>Total Registrations</h3>
            <div className="metric-value">{totalRegistrations}</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaUsers />
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-info">
            <h3>Confirmed Centers</h3>
            <div className="metric-value">{totalConfirmed}</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaCheckCircle />
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-info">
            <h3>Active Exam Centers</h3>
            <div className="metric-value">{centers.length}</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaMapMarkerAlt />
          </div>
        </div>
      </div>

      {/* Centerwise Breakdown */}
      <div className="section-card">
        <h2 className="section-title">
          <FaGlobe className="text-primary" /> Center-Wise Registrations &amp; Confirmations
        </h2>
        
        {centers.length === 0 ? (
          <div className="empty-state">
            <FaMapMarkerAlt className="empty-state-icon" />
            <h3>No exam center data found</h3>
            <p>Database is empty or no final exam centers were provided.</p>
          </div>
        ) : (
          <div className="center-grid">
            {centers.map(center => (
              <div key={center.name} className="center-card">
                <div className="center-header">
                  <div className="center-name" title={center.name}>{center.name}</div>
                  <div className="center-badge">Center Status</div>
                </div>

                <div className="center-stats-summary">
                  <div>
                    Registrations: <strong>{center.registrations}</strong>
                  </div>
                  <div>
                    Confirmations: <strong>{center.confirmations}</strong>
                  </div>
                </div>

                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${center.percentage}%` }}
                  ></div>
                </div>
                
                <div className="center-percent">
                  {center.percentage}% Confirmed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Logging Statistics & Database Control Panel */}
      <div className="section-card" style={{ marginTop: '2.5rem' }}>
        <h2 className="section-title">
          <FaDatabase className="text-primary" /> Secondary DB Call Statistics &amp; Control
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Total Calls */}
          <div className="center-card" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(255, 255, 255, 0.45)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Calls Taken</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>{totalCalls}</div>
          </div>
          {/* Confirmed Yes */}
          <div className="center-card" style={{ borderLeft: '4px solid var(--secondary)', background: 'rgba(255, 255, 255, 0.45)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Participation Confirmed (Yes)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--secondary)' }}>{totalYes}</div>
          </div>
          {/* Declined No */}
          <div className="center-card" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(255, 255, 255, 0.45)', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Participation Declined (No)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--danger)' }}>{totalNo}</div>
          </div>
        </div>

        {/* Database Wiping Option */}
        <div className="center-card" style={{ background: 'rgba(239, 68, 68, 0.015)', borderColor: 'rgba(239, 68, 68, 0.12)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                <FaTrashAlt style={{ color: 'var(--danger)' }} /> Clear Secondary Call Logs Database
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Wipe all student call logs recorded in the secondary database. <strong>Note: Primary student registrations are completely protected and will not be touched.</strong>
              </p>
            </div>
            
            <button
              onClick={() => setShowWipeModal(true)}
              className="modal-btn no"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', width: 'auto', flexShrink: 0 }}
            >
              Clear Secondary DB
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Overlay */}
      {showWipeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirm Database Wipe</h3>
            </div>
            <div className="modal-body" style={{ margin: '1rem 0' }}>
              <p>Are you sure you want to permanently clear all call logs from the secondary database?</p>
              <div className="modal-student-info" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.15)', fontSize: '0.82rem', margin: '0.75rem 0 0 0' }}>
                Warning: This action cannot be undone!
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn no"
                disabled={isWiping}
                onClick={handleConfirmWipe}
              >
                {isWiping ? wipeStatus : 'Yes, Wipe Call Logs'}
              </button>
              <button
                className="modal-btn cancel"
                disabled={isWiping}
                onClick={() => setShowWipeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
