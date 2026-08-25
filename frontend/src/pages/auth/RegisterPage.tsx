import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Eye, EyeOff, CheckCircle2, Zap, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/auth.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [registerStage, setRegisterStage] = useState<'idle' | 'creating' | 'success'>('idle');

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 8) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Validation Error', 'Password must be at least 8 characters long', 'warning');
      return;
    }

    setRegisterStage('creating');
    const ok = await register(name, email, password);
    if (ok) {
      setRegisterStage('success');
      showToast('Account Created Successfully', `Welcome to CloudPulse, ${name}!`, 'success');
      setTimeout(() => {
        navigate('/');
      }, 600);
    } else {
      setRegisterStage('idle');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Registration Error', 'Unable to create account with this email', 'error');
    }
  };

  return (
    <div className="auth-container">
      {/* Dynamic Animated Ambient Background */}
      <div className="auth-ambient-bg">
        <div className="auth-blob-1" />
        <div className="auth-blob-2" />
        <div className="auth-grid-overlay" />
      </div>

      {/* Glassmorphic Chic Register Card */}
      <div className={`auth-glass-card ${isShaking ? 'shake' : ''} ${registerStage === 'success' ? 'success-transition' : ''}`} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="auth-logo-badge">
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#f8fafc' }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Get instant access to clean residential proxy pools & telemetry
          </p>
        </div>

        {/* Feature Highlights Ribbon */}
        <div className="auth-highlights">
          <div className="auth-highlight-item">
            <Zap size={14} />
            <span>Over 100K+ clean residential IPs across 195+ countries</span>
          </div>
          <div className="auth-highlight-item">
            <ShieldCheck size={14} />
            <span>Argon2id cryptographic isolation & real-time cache invalidation</span>
          </div>
          <div className="auth-highlight-item">
            <Activity size={14} />
            <span>Ultra-low latency streaming with 11,000+ req/s gateway capacity</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-input-label">
              <span>Full Name</span>
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <User size={16} />
              </div>
              <input
                type="text"
                className="auth-input"
                style={{ paddingLeft: '2.9rem', paddingRight: '1rem' }}
                placeholder="e.g. Satoshi Nakamoto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={registerStage !== 'idle'}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">
              <span>Work Email Address</span>
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Mail size={16} />
              </div>
              <input
                type="email"
                className="auth-input"
                style={{ paddingLeft: '2.9rem', paddingRight: '1rem' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={registerStage !== 'idle'}
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-label">
              <span>Create Password</span>
              <span style={{ fontSize: '0.72rem', color: strength === 3 ? '#10b981' : strength === 2 ? '#f59e0b' : '#64748b' }}>
                {strength === 3 ? 'Strong' : strength === 2 ? 'Medium' : 'Min 8 chars'}
              </span>
            </div>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                style={{ paddingLeft: '2.9rem', paddingRight: '2.8rem' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={registerStage !== 'idle'}
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

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="strength-meter">
                <div className={`strength-bar ${strength >= 1 ? (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''}`} />
                <div className={`strength-bar ${strength >= 2 ? (strength === 2 ? 'medium' : 'strong') : ''}`} />
                <div className={`strength-bar ${strength >= 3 ? 'strong' : ''}`} />
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`auth-submit-btn ${registerStage === 'success' ? 'success-state' : ''}`}
            disabled={registerStage !== 'idle' || isLoading}
          >
            {registerStage === 'creating' ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Creating Account...</span>
              </>
            ) : registerStage === 'success' ? (
              <>
                <CheckCircle2 size={18} style={{ animation: 'checkmarkPop 0.4s ease forwards' }} />
                <span>Account Ready! Redirecting...</span>
              </>
            ) : (
              <>
                <span>Get Started Free</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <NavLink to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </NavLink>
        </div>
      </div>
    </div>
  );
};
