import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, Sparkles, UserCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/auth.css';

type RolePreset = 'customer' | 'admin' | 'validator';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();

  const [activeRole, setActiveRole] = useState<RolePreset>('customer');
  const [email, setEmail] = useState('alex.mercer@cloudinfra.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const selectRole = (role: RolePreset) => {
    setActiveRole(role);
    if (role === 'customer') {
      setEmail('alex.mercer@cloudinfra.io');
      setPassword('Password123!');
    } else if (role === 'admin') {
      setEmail('admin.operator@cloudpulse.io');
      setPassword('AdminSecurePass123!');
    } else if (role === 'validator') {
      setEmail('validator@enterprise.com');
      setPassword('DeployPassword123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login(email, password);
    if (ok) {
      showToast('Authenticated Successfully', `Welcome back to CloudPulse, ${email}`, 'success');
      navigate('/');
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Authentication Failed', 'Invalid credentials or inactive account', 'error');
    }
  };

  return (
    <div className="auth-container">
      {/* Dynamic Animated Ambient Background Canvas */}
      <div className="auth-ambient-bg">
        <div className="auth-blob-1" />
        <div className="auth-blob-2" />
        <div className="auth-grid-overlay" />
      </div>

      {/* Glassmorphic Chic Login Card */}
      <div className={`auth-glass-card ${isShaking ? 'shake' : ''}`}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="auth-logo-badge">
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#f8fafc' }}>
            Welcome to CloudPulse
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            High-throughput residential proxy control plane & telemetry
          </p>
        </div>

        {/* Quick Role Switcher Tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab ${activeRole === 'customer' ? 'active' : ''}`}
            onClick={() => selectRole('customer')}
          >
            <UserCheck size={14} />
            Customer
          </button>
          <button
            type="button"
            className={`auth-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => selectRole('admin')}
          >
            <Sparkles size={14} />
            Super Admin
          </button>
          <button
            type="button"
            className={`auth-role-tab ${activeRole === 'validator' ? 'active' : ''}`}
            onClick={() => selectRole('validator')}
          >
            <KeyRound size={14} />
            Validator
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-input-label">
              <span>Work Email Address</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Argon2id Protected</span>
            </label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-label">
              <span>Password</span>
              <span style={{ fontSize: '0.72rem', color: '#818cf8', cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Authenticating Control Plane...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.825rem', color: '#94a3b8' }}>
          Don't have an enterprise account?{' '}
          <NavLink to="/register" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
            Register Now
          </NavLink>
        </div>
      </div>
    </div>
  );
};
