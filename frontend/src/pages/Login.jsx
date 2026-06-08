import { useState } from 'react';
import { FaLock, FaSignInAlt, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';

export default function Login({ onLoginSuccess, errorMsg, setErrorMsg, BACKEND_URL }) {
  const [adminId, setAdminId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setErrorMsg('Admin ID is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: adminId.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.adminId);
      } else {
        setErrorMsg(data.error || 'Failed to login.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <FaDatabase />
          </div>
          <h2>Student Portal</h2>
          <p>Admin Database Visualizer & Control Panel</p>
        </div>

        {errorMsg && (
          <div className="error-alert">
            <FaExclamationTriangle className="error-alert-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="adminId-input">Enter Admin ID / Password</label>
            <div className="input-with-icon">
              <input
                id="adminId-input"
                type="text"
                className="input-control"
                placeholder="e.g. admin"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <FaLock className="input-icon" />
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                Access Dashboard <FaSignInAlt />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
