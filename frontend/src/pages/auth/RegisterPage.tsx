import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import '../../styles/auth.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendRegistrationOTP, verifyRegistrationOTP, loginWithGoogle, isLoading } = useAuth();
  const { showToast } = useToast();

  // Step state: 'details' (Name, Email, Passwords) or 'otp' (6-digit confirmation)
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Fields (6 individual digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [receivedDevOtp, setReceivedDevOtp] = useState<string | null>(null);

  // UI Flow & Animations
  const [isShaking, setIsShaking] = useState(false);
  const [stage, setStage] = useState<'idle' | 'sending' | 'verifying' | 'success'>('idle');

  // Input refs for auto-focusing next OTP digit
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Compute password strength score (0 - 3)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Step 1: Send OTP to User Email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password.length < 8) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Password Too Short', 'Password must be at least 8 characters long', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Passwords Do Not Match', 'Please ensure both password fields match exactly', 'error');
      return;
    }

    setStage('sending');
    const result = await sendRegistrationOTP(name, email, password, confirmPassword);

    if (result.success) {
      setStage('idle');
      setStep('otp');
      setResendCooldown(60);
      if (result.devOtp) {
        setReceivedDevOtp(result.devOtp);
      }
      showToast('Verification Code Sent', `We sent a 6-digit code to ${email}`, 'success');
      // Focus first OTP input after DOM render
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } else {
      setStage('idle');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Registration Error', result.message || 'Unable to proceed with registration', 'error');
    }
  };

  // Handle Step 2: Confirm OTP and Auto-Login
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Incomplete Code', 'Please enter all 6 digits of the verification code', 'warning');
      return;
    }

    setStage('verifying');
    const result = await verifyRegistrationOTP(email, fullOtp);

    if (result.success) {
      setStage('success');
      showToast('Account Verified!', `Welcome to CloudPulse, ${name}! Redirecting...`, 'success');
      setTimeout(() => {
        navigate('/');
      }, 600);
    } else {
      setStage('idle');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      showToast('Verification Failed', result.message || 'Incorrect or expired verification code', 'error');
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    const result = await sendRegistrationOTP(name, email, password, confirmPassword);
    setIsResending(false);

    if (result.success) {
      setResendCooldown(60);
      if (result.devOtp) {
        setReceivedDevOtp(result.devOtp);
      }
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      showToast('Code Resent', `A new verification code was sent to ${email}`, 'success');
    } else {
      showToast('Resend Failed', result.message || 'Could not resend verification code', 'error');
    }
  };

  // OTP Input Changes with Auto-Advance and Paste Support
  const handleOtpDigitChange = (index: number, value: string) => {
    // Handle paste event (e.g. user pastes 6 digits)
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
        if (pasted.length === 6) {
          setTimeout(() => {
            handleVerifyOTP();
          }, 100);
        }
      }
      return;
    }

    // Only allow single numeric character
    const sanitized = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = sanitized;
    setOtpDigits(newDigits);

    // Auto-advance if digit typed
    if (sanitized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto-submit
    if (sanitized && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        setTimeout(() => {
          handleVerifyOTP();
        }, 100);
      }
    }
  };

  // Backspace handling across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
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

      {/* Glassmorphic Register Card */}
      <div
        className={`auth-glass-card ${isShaking ? 'shake' : ''} ${stage === 'success' ? 'success-transition' : ''}`}
        style={{ maxWidth: '490px' }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="auth-logo-badge">
            <Shield size={28} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em', color: '#f8fafc' }}>
            {step === 'details' ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            {step === 'details'
              ? 'Instant access to clean residential proxy pools & telemetry'
              : `We sent a 6-digit confirmation code to ${email}`}
          </p>
        </div>

        {/* ===================================================================
            STEP 1: DETAILS (NAME, EMAIL, 2x PASSWORD)
            =================================================================== */}
        {step === 'details' ? (
          <>
            {/* Google OAuth Register Option */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={async () => {
                setStage('sending');
                await loginWithGoogle();
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
                or with credentials
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSendOTP}>
              {/* Full Name */}
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
                    placeholder="e.g. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={stage !== 'idle'}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  <span>Email Address</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>OTP Verified</span>
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
                    disabled={stage !== 'idle'}
                    required
                  />
                </div>
              </div>

              {/* Password 1: Create Password */}
              <div className="auth-input-group">
                <div className="auth-input-label">
                  <span>Create Password</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: strength === 3 ? '#10b981' : strength === 2 ? '#f59e0b' : '#64748b',
                    }}
                  >
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
                    disabled={stage !== 'idle'}
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

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="strength-meter">
                    <div
                      className={`strength-bar ${
                        strength >= 1 ? (strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong') : ''
                      }`}
                    />
                    <div
                      className={`strength-bar ${
                        strength >= 2 ? (strength === 2 ? 'medium' : 'strong') : ''
                      }`}
                    />
                    <div className={`strength-bar ${strength >= 3 ? 'strong' : ''}`} />
                  </div>
                )}
              </div>

              {/* Password 2: Confirm Password */}
              <div className="auth-input-group">
                <div className="auth-input-label">
                  <span>Confirm Password</span>
                  {passwordsMatch && (
                    <span className="pass-match-tag match">
                      <Check size={12} /> Passwords match
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="pass-match-tag mismatch">
                      <AlertCircle size={12} /> Do not match
                    </span>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    style={{
                      paddingLeft: '2.9rem',
                      paddingRight: '2.8rem',
                      borderColor: passwordsMismatch
                        ? 'rgba(239, 68, 68, 0.6)'
                        : passwordsMatch
                        ? 'rgba(16, 185, 129, 0.6)'
                        : undefined,
                    }}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={stage !== 'idle'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Step 1 Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={stage !== 'idle' || isLoading || passwordsMismatch}
                style={{ marginTop: '0.5rem' }}
              >
                {stage === 'sending' ? (
                  <>
                    <div
                      className="spinner"
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* ===================================================================
              STEP 2: OTP VERIFICATION (6 DIGIT CODE)
              =================================================================== */
          <div>
            <form onSubmit={handleVerifyOTP}>
              <div className="otp-container">
                {/* 6 Digit Input Boxes */}
                <div className="otp-inputs">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className={`otp-digit-input ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      disabled={stage === 'verifying' || stage === 'success'}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {/* Resend Timer & Action */}
                <div className="otp-timer-box">
                  <span>
                    {resendCooldown > 0 ? (
                      <>Code expires in <strong>{resendCooldown}s</strong></>
                    ) : (
                      'Didn’t receive the code?'
                    )}
                  </span>
                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending || stage === 'verifying'}
                  >
                    {isResending ? (
                      'Sending...'
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={12} /> Resend OTP
                      </span>
                    )}
                  </button>
                </div>

                {receivedDevOtp && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      const digits = receivedDevOtp.split('').slice(0, 6);
                      setOtpDigits(digits);
                      setTimeout(() => {
                        otpInputRefs.current[5]?.focus();
                      }, 50);
                    }}
                  >
                    <span>Verification Code: <strong style={{ letterSpacing: '2px', fontSize: '0.95rem' }}>{receivedDevOtp}</strong> (Click to auto-fill)</span>
                  </div>
                )}
              </div>

              {/* Submit Step 2 Button */}
              <button
                type="submit"
                className={`auth-submit-btn ${stage === 'success' ? 'success-state' : ''}`}
                disabled={stage !== 'idle' && stage !== 'sending'}
              >
                {stage === 'verifying' ? (
                  <>
                    <div
                      className="spinner"
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Verifying Code & Creating Account...</span>
                  </>
                ) : stage === 'success' ? (
                  <>
                    <CheckCircle2 size={18} style={{ animation: 'checkmarkPop 0.4s ease forwards' }} />
                    <span>Verified! Launching Dashboard...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Verify & Enter Dashboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Edit Details */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="otp-back-btn"
                onClick={() => {
                  setStep('details');
                  setOtpDigits(['', '', '', '', '', '']);
                }}
                disabled={stage === 'verifying' || stage === 'success'}
              >
                <ArrowLeft size={14} /> Back to Edit Details
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: '#94a3b8' }}>
          Already have an enterprise account?{' '}
          <NavLink to="/login" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
            Sign In
          </NavLink>
        </div>
      </div>
    </div>
  );
};
