import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [burnerHandle, setBurnerHandle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleSendOtp = async (targetPhone = phone) => {
    const rawPhone = targetPhone.trim();
    if (!rawPhone) {
      setError('Please enter your phone number first.');
      return false;
    }
    setError('');
    setOtpMessage('');
    setIsSendingOtp(true);
    setDevCodeHint('');

    try {
      const res = await apiFetch('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: rawPhone })
      });
      setIsOtpSent(true);
      setOtpMessage(res.message || 'Verification code sent to your phone.');
      if (res.dev_code) {
        setDevCodeHint(res.dev_code);
      }
      setResendCooldown(60);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to send verification SMS.');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (!code) {
      setError('Please enter the 6-digit verification code.');
      return false;
    }
    setError('');
    setOtpMessage('');
    setIsVerifyingOtp(true);

    try {
      await apiFetch('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), otp_code: code })
      });
      setIsPhoneVerified(true);
      setVerifiedPhone(phone.trim());
      setOtpMessage('Phone number verified successfully! Verified identity active.');
      return true;
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
      return false;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPhone = () => {
    setIsPhoneVerified(false);
    setIsOtpSent(false);
    setOtpCode('');
    setDevCodeHint('');
    setOtpMessage('');
    setResendCooldown(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        const data = await apiFetch('/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });

        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        if (!phone.trim()) {
          setError('Phone number is required.');
          setIsLoading(false);
          return;
        }

        // Check if phone has been verified
        if (!isPhoneVerified) {
          // If code was sent and user typed the code, verify it now
          if (isOtpSent && otpCode.trim()) {
            const verified = await handleVerifyOtp();
            if (!verified) {
              setIsLoading(false);
              return;
            }
          } else if (!isOtpSent) {
            // Automatically send OTP
            await handleSendOtp();
            setError('We just sent a 6-digit confirmation code to your phone. Enter it below to activate your account.');
            setIsLoading(false);
            return;
          } else {
            setError('Please enter and verify the 6-digit SMS code sent to your phone.');
            setIsLoading(false);
            return;
          }
        }

        const payload = {
          email: email.trim(),
          password,
          phone: phone.trim(),
          profile: { burner_handle: burnerHandle.trim() }
        };

        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        const data = await apiFetch('/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });

        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-color)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* Top Header Back Button */}
      <div style={{
        position: 'absolute',
        top: '1.25rem',
        left: '1.25rem',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.95rem',
            borderRadius: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--brandblue)',
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '0.84rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Marketplace</span>
        </button>
      </div>

      {/* Brand Header */}
      <div 
        onClick={() => navigate('/dashboard')} 
        style={{ cursor: 'pointer', marginBottom: '1.5rem', textAlign: 'center', marginTop: '2.5rem' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: '800',
          fontSize: '2.2rem',
          letterSpacing: '-0.03em',
          color: 'var(--text-main)',
          marginBottom: '0.35rem'
        }}>
          Campus<span className="text-brandblue">Stash</span>
        </div>
        <span className="badge-pill">
          <i className="fa-solid fa-shield-halved" /> Verified Student Commerce
        </span>
      </div>

      {/* Auth Card */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '2rem 1.5rem',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)',
        boxSizing: 'border-box'
      }}>
        
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '12px',
          padding: '0.3rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border)'
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setOtpMessage(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: isLogin ? 'var(--surface)' : 'transparent',
              color: isLogin ? 'var(--brandblue)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: isLogin ? '700' : '500',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setOtpMessage(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: !isLogin ? 'var(--surface)' : 'transparent',
              color: !isLogin ? 'var(--brandblue)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: !isLogin ? '700' : '500',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.35rem',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
          marginBottom: '0.35rem',
          textAlign: 'center'
        }}>
          {isLogin ? 'Welcome Back!' : 'Create Verified Student Account'}
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.86rem',
          marginBottom: '1.25rem',
          textAlign: 'center'
        }}>
          {isLogin 
            ? 'Sign in to contact sellers and manage your campus listings.' 
            : 'Protect the campus marketplace. Verify your Nigerian phone number to prevent spam.'}
        </p>

        {error && (
          <div style={{
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: '1.4'
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {otpMessage && (
          <div style={{
            color: '#065f46',
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: '1.4'
          }}>
            <i className="fa-solid fa-circle-check" style={{ flexShrink: 0 }} />
            <span>{otpMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label className="form-label">Email Address</label>
            <input 
              className="form-input"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@university.edu.ng"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input 
              className="form-input"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              {/* Phone Verification Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Phone Number (SMS Verified)</label>
                  {isPhoneVerified && (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fa-solid fa-circle-check" /> Verified
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    className="form-input"
                    type="tel" 
                    required
                    disabled={isPhoneVerified}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678 or +234..."
                    style={{
                      flex: 1,
                      borderColor: isPhoneVerified ? '#10b981' : undefined,
                      backgroundColor: isPhoneVerified ? 'var(--surface-alt)' : undefined
                    }}
                  />

                  {isPhoneVerified ? (
                    <button
                      type="button"
                      onClick={handleResetPhone}
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      title="Change phone number"
                    >
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isSendingOtp || resendCooldown > 0}
                      style={{
                        padding: '0.55rem 0.95rem',
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: '700',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: resendCooldown > 0 ? 'var(--surface-alt)' : 'var(--brandblue)',
                        color: resendCooldown > 0 ? 'var(--text-muted)' : '#ffffff',
                        cursor: (isSendingOtp || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {isSendingOtp ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin" />
                          <span>Sending...</span>
                        </>
                      ) : resendCooldown > 0 ? (
                        <span>Resend ({resendCooldown}s)</span>
                      ) : (
                        <span>{isOtpSent ? 'Resend' : 'Send Code'}</span>
                      )}
                    </button>
                  )}
                </div>

                {/* OTP Code Entry Block */}
                {!isPhoneVerified && isOtpSent && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.9rem',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        Enter 6-Digit SMS Code
                      </span>
                      {devCodeHint && (
                        <button
                          type="button"
                          onClick={() => setOtpCode(devCodeHint)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--brandblue)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Auto-fill Code ({devCodeHint})
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        className="form-input"
                        type="text" 
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          letterSpacing: '0.3rem',
                          fontFamily: 'var(--font-display)',
                          fontWeight: '800',
                          fontSize: '1.2rem',
                          padding: '0.45rem'
                        }}
                      />

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpCode.length < 4}
                        style={{
                          padding: '0.55rem 1rem',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontFamily: 'var(--font-display)',
                          fontWeight: '700',
                          fontSize: '0.84rem',
                          cursor: (isVerifyingOtp || otpCode.length < 4) ? 'not-allowed' : 'pointer',
                          opacity: otpCode.length < 4 ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isVerifyingOtp ? (
                          <i className="fa-solid fa-circle-notch fa-spin" />
                        ) : (
                          <i className="fa-solid fa-check" />
                        )}
                        <span>Confirm</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Burner Handle (Public Alias)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                    fontWeight: '600'
                  }}>
                    @
                  </span>
                  <input 
                    className="form-input"
                    type="text" 
                    value={burnerHandle}
                    onChange={(e) => setBurnerHandle(e.target.value)}
                    placeholder="e.g. campus_vendor"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading || (!isLogin && isSendingOtp)}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" />
                Processing...
              </>
            ) : (
              isLogin ? 'Log In to CampusStash' : 'Complete Verification & Sign Up'
            )}
          </button>
        </form>

        {/* Skip & Browse Guest Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brandblue)',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Browse Items as Guest</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
