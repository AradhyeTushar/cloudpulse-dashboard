import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Eye, EyeOff, CheckCircle2, Zap, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/auth.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isLoading } = useAuth();
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
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
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

        {/* Google OAuth Register Button */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={async () => {
            setRegisterStage('creating');
            const ok = await loginWithGoogle();
            if (ok) {
              setRegisterStage('success');
              showToast('Google Sign-Up', 'Successfully registered with Google Workspace', 'success');
              setTimeout(() => navigate('/'), 600);
            } else {
              setRegisterStage('idle');
              showToast('Google Sign-Up', 'Failed to register with Google', 'error');
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#f8fafc',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.25rem',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
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
