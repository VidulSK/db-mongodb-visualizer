import React, { useState, useMemo } from 'react';
import { FaPhoneAlt, FaWhatsapp, FaCheck, FaSearch, FaFilter, FaRedo } from 'react-icons/fa';

export default function MakeCalls({ students = [], callLogs = {}, onConfirmCall }) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');

  // 1. Dynamically compute unique filter options from database fields
  const filterOptions = useMemo(() => {
    const streams = new Set();
    const centers = new Set();
    const mediums = new Set();

    students.forEach(student => {
      if (student["Subject Stream"]) streams.add(student["Subject Stream"]);
      if (student["Preferred Exam Center"]) centers.add(student["Preferred Exam Center"]);
      if (student["Medium"]) mediums.add(student["Medium"]);
    });

    return {
      streams: Array.from(streams).sort(),
      centers: Array.from(centers).sort(),
      mediums: Array.from(mediums).sort()
    };
  }, [students]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStream('');
    setSelectedCenter('');
    setSelectedMedium('');
  };

  // 2. Filter and sort students list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Text Search: matches first name, last name, or WhatsApp number
      const fullName = `${student["First Name"] || ''} ${student["Last Name"] || ''}`.toLowerCase();
      const num = (student["Whatsapp Number"] || '').toLowerCase();
      const matchesSearch = searchTerm === '' || 
        fullName.includes(searchTerm.toLowerCase()) || 
        num.includes(searchTerm.toLowerCase());

      // Dropdown filters
      const matchesStream = selectedStream === '' || student["Subject Stream"] === selectedStream;
      const matchesCenter = selectedCenter === '' || student["Preferred Exam Center"] === selectedCenter;
      const matchesMedium = selectedMedium === '' || student["Medium"] === selectedMedium;

      return matchesSearch && matchesStream && matchesCenter && matchesMedium;
    }).sort((a, b) => {
      // Sort: show pending calls first (uncalled students first)
      const aCalled = !!callLogs[a["Whatsapp Number"]];
      const bCalled = !!callLogs[b["Whatsapp Number"]];
      if (aCalled === bCalled) {
        const aName = `${a["First Name"]} ${a["Last Name"]}`;
        const bName = `${b["First Name"]} ${b["Last Name"]}`;
        return aName.localeCompare(bName);
      }
      return aCalled ? 1 : -1;
    });
  }, [students, callLogs, searchTerm, selectedStream, selectedCenter, selectedMedium]);

  // Clean WhatsApp number for link (remove plus, spaces)
  const cleanNumberForWhatsApp = (num) => {
    return num ? num.replace(/[^\d]/g, '') : '';
  };

  return (
    <div>
      {/* Filtering GUI Toolbar */}
      <div className="toolbar">
        {/* Search */}
        <div className="form-group">
          <label htmlFor="search-input">Search Student</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="search-input"
              type="text"
              placeholder="Search name or number..."
              className="input-control"
              style={{ width: '100%', paddingLeft: '2.2rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch style={{ position: 'absolute', left: '0.8rem', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Stream Filter */}
        <div className="form-group">
          <label htmlFor="stream-filter">Subject Stream</label>
          <select
            id="stream-filter"
            className="input-control"
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
          >
            <option value="">All Streams</option>
            {filterOptions.streams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
        </div>

        {/* Center Filter */}
        <div className="form-group">
          <label htmlFor="center-filter">Exam Center</label>
          <select
            id="center-filter"
            className="input-control"
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
          >
            <option value="">All Centers</option>
            {filterOptions.centers.map(center => (
              <option key={center} value={center}>{center}</option>
            ))}
          </select>
        </div>

        {/* Medium Filter */}
        <div className="form-group">
          <label htmlFor="medium-filter">Medium</label>
          <select
            id="medium-filter"
            className="input-control"
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
          >
            <option value="">All Mediums</option>
            {filterOptions.mediums.map(medium => (
              <option key={medium} value={medium}>{medium}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Queue Summary / Info */}
      <div className="queue-summary">
        <div className="queue-count">
          Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
        </div>
        {(searchTerm || selectedStream || selectedCenter || selectedMedium) && (
          <button 
            onClick={resetFilters} 
            className="tab-btn" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
          >
            <FaRedo size={10} /> Reset Filters
          </button>
        )}
      </div>

      {/* Grid List of Cards */}
      {filteredStudents.length === 0 ? (
        <div className="empty-state">
          <FaFilter className="empty-state-icon" />
          <h3>No students match filters</h3>
          <p>Try clearing some selections or typing a different search query.</p>
        </div>
      ) : (
        <div className="queue-grid">
          {filteredStudents.map(student => {
            const waNumber = student["Whatsapp Number"];
            const hasBeenCalled = !!callLogs[waNumber];
            const isConfirmedCenter = student.exam_center_confirmed26 === true;

            return (
              <div 
                key={waNumber} 
                className={`queue-card ${hasBeenCalled ? 'called' : ''}`}
              >
                <div className="queue-card-top">
                  <div className="student-identity">
                    <div className="student-name">
                      {student["First Name"]} {student["Last Name"]}
                    </div>
                    <span className={`student-tag ${isConfirmedCenter ? 'confirmed' : 'unconfirmed'}`}>
                      {isConfirmedCenter ? 'Confirmed' : 'Unconfirmed'}
                    </span>
                  </div>

                  <div className="details-list">
                    <span className="detail-badge stream">{student["Subject Stream"]}</span>
                    <span className="detail-badge center">{student["Preferred Exam Center"]}</span>
                    <span className="detail-badge medium">{student["Medium"]}</span>
                  </div>

                  <div className="wa-container">
                    <span>WhatsApp:</span>
                    <a 
                      href={`https://wa.me/${cleanNumberForWhatsApp(waNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-link"
                      title="Open chat on WhatsApp"
                    >
                      <FaWhatsapp /> {waNumber}
                    </a>
                  </div>
                </div>

                <div className="queue-card-actions">
                  {hasBeenCalled ? (
                    <button className="btn-confirm-call completed" disabled>
                      <FaCheck /> Call Logged
                    </button>
                  ) : (
                    <button 
                      className="btn-confirm-call pending"
                      onClick={() => onConfirmCall(waNumber)}
                    >
                      <FaPhoneAlt size={12} /> Confirm Call Taken
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
