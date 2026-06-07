import React, { useState, useMemo, useEffect } from 'react';
import { FaPhoneAlt, FaWhatsapp, FaCheck, FaSearch, FaFilter, FaRedo, FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function MakeCalls({ students = [], callLogs = {}, onConfirmCall, adminId, whatsappConfig = { template: '', greetings: [] } }) {
  // Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [sortBy, setSortBy] = useState('uncalled');

  // Confirmation Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // WhatsApp click session counter
  const [clickSessionCounter, setClickSessionCounter] = useState(() => {
    const key = `whatsapp_count_${adminId || 'default'}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  });

  const incrementClickCount = () => {
    const key = `whatsapp_count_${adminId || 'default'}`;
    const nextVal = clickSessionCounter + 1;
    localStorage.setItem(key, nextVal.toString());
    setClickSessionCounter(nextVal);
  };

  const getWhatsAppLink = (student) => {
    const waNumber = (student["WhatsApp Number"] || student["Whatsapp Number"] || "").trim();
    if (!waNumber) return '';

    const greetingsList = whatsappConfig.greetings && whatsappConfig.greetings.length > 0
      ? whatsappConfig.greetings
      : ['Hi', 'Hello'];

    const greetingIndex = Math.floor(clickSessionCounter / 10) % greetingsList.length;
    const currentGreeting = greetingsList[greetingIndex];

    const center = (student["Preferred Exam Center"] || student["final_exam_center"] || "").trim();
    
    // 1. Resolve Paper Placeholder
    const centerPapers = whatsappConfig.centerPapers || {};
    let paper = '';
    const exactPaperMatch = Object.keys(centerPapers).find(key => key.toLowerCase() === center.toLowerCase());
    if (exactPaperMatch) {
      paper = centerPapers[exactPaperMatch];
    } else {
      const partialPaperMatch = Object.keys(centerPapers).find(key => 
        key.toLowerCase() !== 'default' && 
        (center.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(center.toLowerCase()))
      );
      paper = partialPaperMatch ? centerPapers[partialPaperMatch] : (centerPapers['default'] || 'Biology සහ Combined Mathematics');
    }

    // 2. Resolve Day Placeholder
    const centerDays = whatsappConfig.centerDays || {};
    let day = '';
    const exactDayMatch = Object.keys(centerDays).find(key => key.toLowerCase() === center.toLowerCase());
    if (exactDayMatch) {
      day = centerDays[exactDayMatch];
    } else {
      const partialDayMatch = Object.keys(centerDays).find(key => 
        key.toLowerCase() !== 'default' && 
        (center.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(center.toLowerCase()))
      );
      day = partialDayMatch ? centerDays[partialDayMatch] : (centerDays['default'] || 'හෙට');
    }

    const template = whatsappConfig.template || '';
    const formattedText = template
      .replace(/{greeting}/g, currentGreeting)
      .replace(/{firstName}/g, student["First Name"] || "")
      .replace(/{lastName}/g, student["Last Name"] || "")
      .replace(/{examCenter}/g, center)
      .replace(/{paper}/g, paper)
      .replace(/{day}/g, day);

    const cleanedNum = cleanNumberForWhatsApp(waNumber);
    return `https://wa.me/${cleanedNum}?text=${encodeURIComponent(formattedText)}`;
  };

  // 1. Dynamically compute unique filter options from database fields
  const filterOptions = useMemo(() => {
    const streams = new Set();
    const centers = new Set();
    const mediums = new Set();

    students.forEach(student => {
      if (student["Subject Stream"]) streams.add(student["Subject Stream"]);
      if (student["final_exam_center"]) centers.add(student["final_exam_center"]);
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
    setSortBy('uncalled');
  };

  // 2. Filter and sort students list
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Text Search: matches first name, last name, or WhatsApp number
      const fullName = `${student["First Name"] || ''} ${student["Last Name"] || ''}`.toLowerCase();
      const num = (student["WhatsApp Number"] || student["Whatsapp Number"] || '').toLowerCase();
      const matchesSearch = searchTerm === '' ||
        fullName.includes(searchTerm.toLowerCase()) ||
        num.includes(searchTerm.toLowerCase());

      // Dropdown filters
      const matchesStream = selectedStream === '' || student["Subject Stream"] === selectedStream;
      const matchesCenter = selectedCenter === '' || student["final_exam_center"] === selectedCenter;
      const matchesMedium = selectedMedium === '' || student["Medium"] === selectedMedium;

      return matchesSearch && matchesStream && matchesCenter && matchesMedium;
    }).sort((a, b) => {
      // Sort dynamically based on sortBy state
      const aCalled = !!callLogs[a["WhatsApp Number"]];
      const bCalled = !!callLogs[b["WhatsApp Number"]];
      if (aCalled !== bCalled) {
        if (sortBy === 'uncalled') {
          return aCalled ? 1 : -1;
        } else {
          return aCalled ? -1 : 1;
        }
      }
      const aName = `${a["First Name"]} ${a["Last Name"]}`;
      const bName = `${b["First Name"]} ${b["Last Name"]}`;
      return aName.localeCompare(bName);
    });
  }, [students, callLogs, searchTerm, selectedStream, selectedCenter, selectedMedium, sortBy]);

  // Clean WhatsApp number for link (ensure 94 prefix, remove leading 0, ensure 9 mobile digits)
  const cleanNumberForWhatsApp = (num) => {
    if (!num) return '';
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('94') && cleaned.length === 11) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 9) {
      return '94' + cleaned;
    }
    return cleaned.startsWith('94') ? cleaned : '94' + cleaned;
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

        {/* Sort By Status */}
        <div className="form-group">
          <label htmlFor="sort-by">Sort By Status</label>
          <select
            id="sort-by"
            className="input-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="uncalled">Uncalled First</option>
            <option value="called">Called First</option>
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
            const waNumber = (student["WhatsApp Number"] || student["Whatsapp Number"] || "").trim();
            const callLog = waNumber ? callLogs[waNumber] : null;
            const hasBeenCalled = waNumber ? !!callLog : false;
            const isConfirmedCenter = student.exam_center_confirmed26 === true ||
              student.exam_center_confirmed26 === 'true' ||
              student.exam_center_confirmed26 === ' true' ||
              (typeof student.exam_center_confirmed26 === 'string' && student.exam_center_confirmed26.trim() === 'true');
            const participationConfirmed = callLog?.participationConfirmed;

            // Use a unique key based on document ID to prevent duplicate key collisions
            const elementKey = student._id || waNumber || `${student["First Name"]}-${student["Last Name"]}-${Math.random()}`;

            return (
              <div
                key={elementKey}
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
                    {student["Subject Stream"] && <span className="detail-badge stream">{student["Subject Stream"]}</span>}
                    {student["final_exam_center"] && <span className="detail-badge center">{student["final_exam_center"]}</span>}
                    {student["Medium"] && <span className="detail-badge medium">{student["Medium"]}</span>}
                  </div>

                  <div className="wa-container" style={{ position: 'relative' }}>
                    <span>Phone:</span>
                    {waNumber ? (
                      <a 
                        href={getWhatsAppLink(student)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wa-link"
                        title="Open chat on WhatsApp"
                        onClick={incrementClickCount}
                      >
                        <FaWhatsapp /> {waNumber}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Not Provided
                      </span>
                    )}
                  </div>

                  {hasBeenCalled && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Participation:</span>
                      {participationConfirmed === true ? (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(5, 150, 105, 0.15)', color: 'var(--secondary)', border: '1px solid rgba(5, 150, 105, 0.25)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaCheckCircle size={10} /> Confirmed (Yes)
                        </span>
                      ) : participationConfirmed === false ? (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaTimesCircle size={10} /> Declined (No)
                        </span>
                      ) : (
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)', border: '1px solid rgba(100, 116, 139, 0.25)', textTransform: 'uppercase' }}>
                          Unspecified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="queue-card-actions">
                  {!waNumber ? (
                    <button className="btn-confirm-call completed" style={{ background: 'rgba(15, 23, 42, 0.05)', color: 'var(--text-muted)', borderColor: 'var(--border-color)', cursor: 'not-allowed' }} disabled>
                      No WhatsApp Number
                    </button>
                  ) : hasBeenCalled ? (
                    <button className="btn-confirm-call completed" disabled>
                      <FaCheck /> Call Logged
                    </button>
                  ) : (
                    <button
                      className="btn-confirm-call pending"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowConfirmModal(true);
                      }}
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

      {/* Confirmation Popup Modal */}
      {showConfirmModal && selectedStudent && (() => {
        const selectedStudentWANumber = (selectedStudent["WhatsApp Number"] || selectedStudent["Whatsapp Number"] || "").trim();
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Student Call</h3>
              </div>
              <div className="modal-body">
                <p>Did you connect with the student and is their participation confirmed?</p>
                <div className="modal-student-info">
                  {selectedStudent["First Name"]} {selectedStudent["Last Name"]}
                  <br />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                    WhatsApp: {selectedStudentWANumber}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="modal-btn yes"
                  onClick={() => {
                    onConfirmCall(selectedStudentWANumber, true);
                    setShowConfirmModal(false);
                    setSelectedStudent(null);
                  }}
                >
                  <FaCheck /> Yes, Confirmed
                </button>
                <button
                  className="modal-btn no"
                  onClick={() => {
                    onConfirmCall(selectedStudentWANumber, false);
                    setShowConfirmModal(false);
                    setSelectedStudent(null);
                  }}
                >
                  <FaTimes /> No, Declined
                </button>
                <button
                  className="modal-btn cancel"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedStudent(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
