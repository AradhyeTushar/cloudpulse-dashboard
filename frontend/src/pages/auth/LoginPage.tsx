import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Activity,
  Globe2,
  Cpu,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/auth.css';

type RolePreset = 'customer' | 'admin' | 'validator';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [activeRole, setActiveRole] = useState<RolePreset>('customer');
  const [email, setEmail] = useState('alex.mercer@cloudinfra.io');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [loginStage, setLoginStage] = useState<'idle' | 'authenticating' | 'success'>('idle');

  // If already authenticated or redirected from Google OAuth, proceed to dashboard
  useEffect(() => {
    const oauthParam = searchParams.get('oauth');
    const tokenParam = searchParams.get('token');
    if (isAuthenticated || oauthParam === 'success' || tokenParam) {
      setLoginStage('success');
      showToast('Authenticated', 'Welcome to CloudPulse Control Plane', 'success');
      const timer = setTimeout(() => {
        if (user?.role === 'owner' || (user?.role as string) === 'admin') {
          navigate('/admin/users');
        } else {
          navigate('/');
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, searchParams, user, navigate, showToast]);

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

    setLoginStage('authenticating');
    const ok = await login(email, password);

    if (ok) {
      setLoginStage('success');
      showToast('Authenticated Successfully', `Welcome back, ${email}`, 'success');
      
      setTimeout(() => {
        if (activeRole === 'admin' || email.includes('admin')) {
          navigate('/admin/users');
        } else {
          navigate('/');
        }
      }, 500);
    } else {
      setLoginStage('idle');
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
        <div className="auth-blob-3" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-split-wrapper">
        {/* Left Hero Showcase Pane */}
        <div className="auth-hero-pane">
          <div className="auth-hero-badge">
            <Sparkles size={14} />
            <span>CLOUDPULSE ENTERPRISE 2.0</span>
          </div>

          <h1 className="auth-hero-title">
            Global Residential <br />
            <span className="auth-hero-gradient-text">Proxy Infrastructure</span>
          </h1>

          <p className="auth-hero-subtitle">
            Zero-leakage sticky sessions, dynamic IP rotation, and real-time network telemetry powered by Argon2id cryptographic validation.
          </p>

          {/* Live Telemetry Mini-Card */}
          <div className="auth-telemetry-box">
            <div className="auth-telemetry-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontWeight: 600 }}>
                <Activity size={16} color="#38bdf8" />
                <span>Primary Gateway Status</span>
              </div>
              <span className="auth-telemetry-pill">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                200.234.41.58 : 8000
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.25rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Globe2 size={12} /> POP Mumbai
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>99.99%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} /> Latency
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', marginTop: 2 }}>14 ms</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Cpu size={12} /> Concurrency
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8', marginTop: 2 }}>Unlimited</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="#10b981" /> SOC-2 Type II Certified
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#38bdf8" /> TLS 1.3 Strict Tunnel
            </span>
          </div>
        </div>

        {/* Right Glassmorphic Login Card */}
        <div className={`auth-glass-card ${isShaking ? 'shake' : ''} ${loginStage === 'success' ? 'success-transition' : ''}`}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="auth-logo-badge">
              <Shield size={28} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Control Plane Sign In
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Authenticate with Google Workspace or service credentials
            </p>
          </div>

          {/* Google OAuth Login Button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={async () => {
              setLoginStage('authenticating');
              await loginWithGoogle();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
              color: '#f8fafc',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.transform = 'translateY(0)';
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
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              or with password
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          {/* Quick Role Switcher Tabs */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`auth-role-tab ${activeRole === 'customer' ? 'active' : ''}`}
              onClick={() => selectRole('customer')}
            >
              <UserCheck size={13} />
              Customer
            </button>
            <button
              type="button"
              className={`auth-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => selectRole('admin')}
            >
              <Sparkles size={13} />
              Super Admin
            </button>
            <button
              type="button"
              className={`auth-role-tab ${activeRole === 'validator' ? 'active' : ''}`}
              onClick={() => selectRole('validator')}
            >
              <KeyRound size={13} />
              Validator
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label className="auth-input-label">
                <span>Account Email</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Argon2id Encrypted</span>
              </label>
              <div className="auth-input-wrapper">
                <div className="auth-input-icon">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginStage !== 'idle'}
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
                <div className="auth-input-icon">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginStage !== 'idle'}
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

            <button
              type="submit"
              className={`auth-submit-btn ${loginStage === 'success' ? 'success-state' : ''}`}
              disabled={loginStage !== 'idle' || isLoading}
            >
              {loginStage === 'authenticating' ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Verifying Credentials...</span>
                </>
              ) : loginStage === 'success' ? (
                <>
                  <CheckCircle2 size={18} style={{ animation: 'checkmarkPop 0.4s ease forwards' }} />
                  <span>Access Granted! Redirecting...</span>
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
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: '#94a3b8' }}>
            Don't have an enterprise account?{' '}
            <NavLink to="/register" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
              Register Now
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
