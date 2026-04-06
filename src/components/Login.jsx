import React, { useState } from 'react';
import { Coffee, User, Lock, LogIn } from 'lucide-react';
import { API_URL } from '../config';
import './Login.css';

const Login = ({ onSuperAdminLogin, onAdminLogin, isSuperAdminView }) => {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, is_super: isSuperAdminView }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        isSuperAdminView ? onSuperAdminLogin() : onAdminLogin();
      } else {
        alert(data.detail || 'Invalid credentials.');
      }
    } catch (error) {
      alert('Network error. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-page-wrapper ${isSuperAdminView ? 'login-page-super' : 'login-page-admin'}`}>
      <div className="login-container animate-fade-up">
        <div className="login-header">
          <div className="login-logo">
            <Coffee size={32} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">
            {isSuperAdminView ? 'Super Admin Portal' : 'VB Cafe Admin'}
          </h1>
          <p className="login-subtitle">
            {isSuperAdminView ? 'Enterprise Management Console' : 'Secure Point of Sale Access'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                type="text"
                className="form-input"
                placeholder={isSuperAdminView ? "Enter root id" : "Enter admin id"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (
              <>
                {isSuperAdminView ? 'Authorize Access' : 'Sign In'} <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        {isSuperAdminView ? (
          <div 
            style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#8b5cf6', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => window.location.pathname = '/'}
          >
            ← Back to Admin Login
          </div>
        ) : (
          <div 
            className="hidden-version-link"
            onClick={() => window.location.pathname = '/superadmin'}
          >
            vx2.4-mns-root
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
