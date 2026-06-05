import React from 'react';
import { FaUsers, FaCheckCircle, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export default function Dashboard({ students = [] }) {
  // 1. Total registrations
  const totalRegistrations = students.length;

  // 2. Total confirmed exam center students (exam_center_confirmed26: true)
  const totalConfirmed = students.filter(s => s.exam_center_confirmed26 === true).length;

  // 3. Centerwise student registrations and confirmations
  const centerDataMap = {};

  students.forEach(student => {
    const center = student["Preferred Exam Center"] || 'Unspecified';
    if (!centerDataMap[center]) {
      centerDataMap[center] = { registrations: 0, confirmations: 0 };
    }
    centerDataMap[center].registrations += 1;
    if (student.exam_center_confirmed26 === true) {
      centerDataMap[center].confirmations += 1;
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
            <p>Database is empty or no preferred exam centers were provided.</p>
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
    </div>
  );
}
