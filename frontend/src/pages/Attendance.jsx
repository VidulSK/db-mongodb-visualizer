import React, { useState, useMemo } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaBook, FaLanguage, FaAngleDown, FaAngleUp, FaUsers, FaCheckCircle } from 'react-icons/fa';

export default function Attendance({ students = [] }) {
  const [selectedDate, setSelectedDate] = useState('all');
  const [expandedCenter, setExpandedCenter] = useState(null);

  // Filter students to only include those where exam_center_confirmed26 is true or " true" / "true"
  // and consider attended_days starting only from 2026-06-06 and beyond (excluding 2025)
  const confirmedStudents = useMemo(() => {
    return students
      .filter(student => {
        const val = student.exam_center_confirmed26;
        return val === true || val === 'true' || val === ' true' || (typeof val === 'string' && val.trim() === 'true');
      })
      .map(student => ({
        ...student,
        attended_days: Array.isArray(student.attended_days)
          ? student.attended_days.filter(date => {
              if (!date || typeof date !== 'string') return false;
              const trimmed = date.trim();
              return trimmed >= '2026-06-06' && !trimmed.startsWith('2025');
            })
          : []
      }));
  }, [students]);

  // 1. Gather all unique dates in chronological order across all students
  const allDates = useMemo(() => {
    const dates = new Set();
    confirmedStudents.forEach(student => {
      if (Array.isArray(student.attended_days)) {
        student.attended_days.forEach(date => {
          if (date && typeof date === 'string') {
            dates.add(date.trim());
          }
        });
      }
    });
    return Array.from(dates).sort();
  }, [confirmedStudents]);

  // 2. Compute overall summary stats for the active date selection
  const overallStats = useMemo(() => {
    const totalStudents = confirmedStudents.length;
    if (totalStudents === 0) return { total: 0, attended: 0, percentage: 0 };

    let attendedCount = 0;
    if (selectedDate === 'all') {
      // Attended at least once
      attendedCount = confirmedStudents.filter(s => Array.isArray(s.attended_days) && s.attended_days.length > 0).length;
    } else {
      // Attended on selectedDate
      attendedCount = confirmedStudents.filter(s => Array.isArray(s.attended_days) && s.attended_days.includes(selectedDate)).length;
    }

    return {
      total: totalStudents,
      attended: attendedCount,
      percentage: Math.round((attendedCount / totalStudents) * 100) || 0
    };
  }, [confirmedStudents, selectedDate]);

  // 3. Compute stats for each exam center
  const centerData = useMemo(() => {
    const dataMap = {};

    confirmedStudents.forEach(student => {
      const center = student["final_exam_center"];
      if (center) {
        if (!dataMap[center]) {
          dataMap[center] = {
            name: center,
            students: []
          };
        }
        dataMap[center].students.push(student);
      }
    });

    return Object.keys(dataMap).map(centerName => {
      const centerObj = dataMap[centerName];
      const totalRegistered = centerObj.students.length;

      // Calculate how many attended under current filter
      let presentCount = 0;
      if (selectedDate === 'all') {
        presentCount = centerObj.students.filter(s => Array.isArray(s.attended_days) && s.attended_days.length > 0).length;
      } else {
        presentCount = centerObj.students.filter(s => Array.isArray(s.attended_days) && s.attended_days.includes(selectedDate)).length;
      }

      const percentage = totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

      // Map attended days (dates) as subject placeholders
      const subjects = allDates.map(date => {
        const presentCountOnDate = centerObj.students.filter(s => Array.isArray(s.attended_days) && s.attended_days.includes(date)).length;
        return {
          name: date,
          registered: totalRegistered,
          present: presentCountOnDate
        };
      });

      // Group medium breakdowns
      const mediumsMap = {};
      centerObj.students.forEach(student => {
        const med = student["Medium"] || 'Unspecified';
        if (!mediumsMap[med]) {
          mediumsMap[med] = { name: med, registered: 0, present: 0 };
        }
        mediumsMap[med].registered += 1;

        const isPresent = selectedDate === 'all'
          ? (Array.isArray(student.attended_days) && student.attended_days.length > 0)
          : (Array.isArray(student.attended_days) && student.attended_days.includes(selectedDate));

        if (isPresent) {
          mediumsMap[med].present += 1;
        }
      });

      // Group date-wise counts for this specific center
      const dateCounts = allDates.map(date => {
        const presentOnDate = centerObj.students.filter(s => Array.isArray(s.attended_days) && s.attended_days.includes(date)).length;
        return {
          date,
          count: presentOnDate,
          percentage: totalRegistered > 0 ? Math.round((presentOnDate / totalRegistered) * 100) : 0
        };
      });

      return {
        name: centerName,
        totalRegistered,
        presentCount,
        percentage,
        subjects,
        mediums: Object.values(mediumsMap).sort((a, b) => b.registered - a.registered),
        dateCounts
      };
    }).sort((a, b) => b.totalRegistered - a.totalRegistered);

  }, [confirmedStudents, selectedDate, allDates]);

  const toggleCenter = (centerName) => {
    if (expandedCenter === centerName) {
      setExpandedCenter(null);
    } else {
      setExpandedCenter(centerName);
    }
  };

  return (
    <div className="attendance-page">
      {/* Date Filter & Control Row */}
      <div className="attendance-toolbar section-card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <FaCalendarAlt className="text-primary" /> Attendance Tracking
          </h2>
          <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="attendance-date-select" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Select Date Filter:
            </label>
            <select
              id="attendance-date-select"
              className="input-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="all">All Dates (Overall)</option>
              {allDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Quick Pills Selector */}
        {allDates.length > 0 && (
          <div className="date-pill-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button
              onClick={() => setSelectedDate('all')}
              className={`date-pill ${selectedDate === 'all' ? 'active' : ''}`}
            >
              Overall (At least 1 day)
            </button>
            {allDates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`date-pill ${selectedDate === date ? 'active' : ''}`}
              >
                {date}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-info">
            <h3>Registered Students</h3>
            <div className="metric-value">{overallStats.total}</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaUsers />
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-info">
            <h3>{selectedDate === 'all' ? 'Attended (Overall)' : 'Attended On Date'}</h3>
            <div className="metric-value">{overallStats.attended}</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaCheckCircle />
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-info">
            <h3>Attendance Rate</h3>
            <div className="metric-value">{overallStats.percentage}%</div>
          </div>
          <div className="metric-icon-wrapper">
            <FaCalendarAlt />
          </div>
        </div>
      </div>

      {/* Centerwise Attendance Section */}
      <div className="section-card">
        <h3 className="section-title">
          <FaMapMarkerAlt className="text-primary" /> Exam Center Attendance Breakdown
        </h3>

        {centerData.length === 0 ? (
          <div className="empty-state">
            <FaMapMarkerAlt className="empty-state-icon" />
            <h3>No exam centers found</h3>
            <p>Database is empty or students do not have exam centers assigned.</p>
          </div>
        ) : (
          <div className="attendance-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {centerData.map(center => {
              const isExpanded = expandedCenter === center.name;
              return (
                <div
                  key={center.name}
                  className={`attendance-center-item ${isExpanded ? 'expanded' : ''}`}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'var(--transition-smooth)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Clickable Header Bar */}
                  <div
                    onClick={() => toggleCenter(center.name)}
                    className="attendance-center-header"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: isExpanded ? 'rgba(15, 23, 42, 0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                          {center.name}
                        </span>
                        <span className="live-indicator" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                          {center.totalRegistered} registered
                        </span>
                      </div>

                      {/* Header progress info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '0.5rem' }}>
                        <div className="progress-container" style={{ flexGrow: 1, margin: 0 }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${center.percentage}%`,
                              background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)'
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                          {center.presentCount} / {center.totalRegistered} ({center.percentage}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                      {isExpanded ? <FaAngleUp size={18} /> : <FaAngleDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Breakdown Block */}
                  {isExpanded && (
                    <div
                      className="attendance-expanded-body"
                      style={{
                        padding: '0 1.5rem 1.75rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        background: '#ffffff'
                      }}
                    >
                      <div
                        className="attendance-breakdown-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '2rem',
                          marginTop: '1.5rem'
                        }}
                      >
                        {/* Subject-Wise */}
                        <div className="breakdown-col">
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <FaBook className="text-primary" /> Subject-Wise Attendance
                          </h4>
                          {center.subjects.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No data</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {center.subjects.map(sub => {
                                const rate = sub.registered > 0 ? Math.round((sub.present / sub.registered) * 100) : 0;
                                return (
                                  <div key={sub.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.name}</span>
                                      <span style={{ color: 'var(--text-secondary)' }}>
                                        {sub.present}/{sub.registered} ({rate}%)
                                      </span>
                                    </div>
                                    <div className="progress-container" style={{ margin: 0, height: '6px' }}>
                                      <div
                                        className="progress-bar"
                                        style={{
                                          width: `${rate}%`,
                                          background: 'var(--primary)'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Medium-Wise */}
                        <div className="breakdown-col">
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <FaLanguage className="text-accent" /> Medium-Wise Attendance
                          </h4>
                          {center.mediums.length === 0 ? (
                            <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No data</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {center.mediums.map(med => {
                                const rate = med.registered > 0 ? Math.round((med.present / med.registered) * 100) : 0;
                                return (
                                  <div key={med.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{med.name}</span>
                                      <span style={{ color: 'var(--text-secondary)' }}>
                                        {med.present}/{med.registered} ({rate}%)
                                      </span>
                                    </div>
                                    <div className="progress-container" style={{ margin: 0, height: '6px' }}>
                                      <div
                                        className="progress-bar"
                                        style={{
                                          width: `${rate}%`,
                                          background: 'var(--accent)'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date-wise lists inside the center for extra detail */}
                      {center.dateCounts.length > 0 && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                            Daily Present Counts for this Center:
                          </h4>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {center.dateCounts.map(dc => (
                              <div
                                key={dc.date}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(dc.date);
                                }}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '10px',
                                  background: selectedDate === dc.date ? 'var(--primary-glow)' : 'rgba(15, 23, 42, 0.02)',
                                  border: `1px solid ${selectedDate === dc.date ? 'var(--primary)' : 'var(--border-color)'}`,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  minWidth: '90px',
                                  transition: 'var(--transition-smooth)'
                                }}
                              >
                                <span style={{ color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{dc.date}</span>
                                <span style={{ color: selectedDate === dc.date ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.85rem' }}>
                                  {dc.count} present ({dc.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
