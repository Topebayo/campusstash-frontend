import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getCampuses, DEFAULT_CAMPUSES } from '../api';

const STORE_CATEGORIES = [
  'Fashion & Thrift',
  'Phones, Gadgets & Tech',
  'Food, Snacks & Pastries',
  'Beauty, Hair & Skincare',
  'Textbooks & Academics',
  'Hostel & Dorm Essentials',
  'Services, Printing & Repairs',
  'General Variety Store'
];

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [burnerHandle, setBurnerHandle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Account Type & Store Onboarding States
  const [accountType, setAccountType] = useState('individual'); // 'individual' | 'store'
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Fashion & Thrift');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessWhatsapp, setBusinessWhatsapp] = useState('');
  const [businessInstagram, setBusinessInstagram] = useState('');
  const [campuses, setCampuses] = useState(() => {
    try {
      const cached = localStorage.getItem('campusstash_cached_campuses');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUSES;
    } catch (e) {
      return DEFAULT_CAMPUSES;
    }
  });
  const [campusId, setCampusId] = useState('');

  useEffect(() => {
    getCampuses().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setCampuses(data);
        if (!campusId) setCampusId(data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Registration OTP Verification State
  const [otpChannel, setOtpChannel] = useState('email'); // 'email' | 'whatsapp' | 'sms'
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password State
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotChannel, setForgotChannel] = useState('email'); // 'email' | 'whatsapp' | 'sms'
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [isForgotOtpSent, setIsForgotOtpSent] = useState(false);
  const [isForgotSending, setIsForgotSending] = useState(false);
  const [isForgotResetting, setIsForgotResetting] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);

  const isAirtelNumber = (num) => {
    if (!num) return false;
    const clean = String(num).replace(/\D/g, '');
    const airtelPrefixes = ['0802', '0808', '0812', '0701', '0708', '0901', '0902', '0904', '0907', '0912', '234802', '234808', '234812', '234701', '234708', '234901', '234902', '234904', '234907', '234912'];
    return airtelPrefixes.some(p => clean.startsWith(p));
  };

  // Countdown timer for Registration OTP resend cooldown
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

  // Countdown timer for Forgot Password OTP resend cooldown
  useEffect(() => {
    let timer = null;
    if (forgotCooldown > 0) {
      timer = setInterval(() => {
        setForgotCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [forgotCooldown]);

  const handleSendOtp = async (targetPhone = phone, channel = otpChannel) => {
    const rawPhone = (targetPhone || '').trim();
    const rawEmail = (email || '').trim().toLowerCase();

    if (channel === 'email') {
      if (!rawEmail || !rawEmail.includes('@')) {
        setError('Please enter your valid email address above first.');
        return false;
      }
    } else {
      if (!rawPhone) {
        setError('Please enter your phone number first.');
        return false;
      }
    }
    setError('');
    setOtpMessage('');
    setIsSendingOtp(true);

    try {
      const res = await apiFetch('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          phone: rawPhone || rawEmail, 
          email: rawEmail || undefined,
          channel 
        })
      });
      setIsOtpSent(true);
      const chName = channel === 'email' ? 'Email' : (channel === 'whatsapp' ? 'WhatsApp' : 'SMS');
      setOtpMessage(res.message || `Verification code sent via ${chName}!`);
      setResendCooldown(60);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
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

    const rawEmail = (email || '').trim().toLowerCase();
    const rawPhone = (phone || '').trim();

    try {
      await apiFetch('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          phone: rawPhone || rawEmail, 
          email: rawEmail || undefined,
          otp_code: code 
        })
      });
      setIsPhoneVerified(true);
      setVerifiedPhone(rawPhone || rawEmail);
      setOtpMessage(otpChannel === 'email' ? 'Email verified successfully! You can now finish creating your account.' : 'Phone number verified successfully!');
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
    setOtpMessage('');
    setResendCooldown(0);
  };

  const handleForgotSendOtp = async (overrideChannel = null) => {
    const rawInput = forgotPhone.trim();
    const activeChannel = (typeof overrideChannel === 'string' && overrideChannel) ? overrideChannel : forgotChannel;
    if (!rawInput) {
      setError('Please enter your registered email address or phone number.');
      return;
    }
    setError('');
    setOtpMessage('');
    setIsForgotSending(true);

    try {
      const isEmail = rawInput.includes('@') || activeChannel === 'email';
      const res = await apiFetch('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          phone: isEmail ? undefined : rawInput,
          email: isEmail ? rawInput.toLowerCase() : undefined,
          channel: isEmail ? 'email' : activeChannel 
        })
      });
      setIsForgotOtpSent(true);
      const chName = isEmail ? 'Email' : (activeChannel === 'whatsapp' ? 'WhatsApp' : 'SMS');
      setOtpMessage(res.message || `Password reset code sent via ${chName}!`);
      setForgotCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setIsForgotSending(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    const rawInput = forgotPhone.trim();
    const code = forgotOtp.trim();
    const newPass = forgotNewPassword;

    if (!rawInput) {
      setError('Email or phone number is required.');
      return;
    }
    if (!code || code.length < 4) {
      setError('Please enter the 6-digit recovery code.');
      return;
    }
    if (!newPass || newPass.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setError('');
    setOtpMessage('');
    setIsForgotResetting(true);

    const isEmail = rawInput.includes('@');

    try {
      const data = await apiFetch('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          phone: isEmail ? undefined : rawInput,
          email: isEmail ? rawInput.toLowerCase() : undefined,
          otp_code: code,
          new_password: newPass
        })
      });

      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        setOtpMessage('Password updated successfully! Signing you in...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 700);
      } else {
        setIsForgotPassword(false);
        setIsLogin(true);
        setOtpMessage('Password updated successfully! Please sign in with your new password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setIsForgotResetting(false);
    }
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

        // Validate store account requirements: Real business name & owner real name
        if (accountType === 'store') {
          if (!businessName.trim()) {
            setError('Please enter your real business / store name.');
            setIsLoading(false);
            return;
          }
          if (!fullName.trim()) {
            setError("Please enter the store owner's real name.");
            setIsLoading(false);
            return;
          }
        }

        // Check if account has been verified via OTP
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
            const sent = await handleSendOtp();
            if (sent) {
              const chName = otpChannel === 'email' ? 'Email' : (otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS');
              const targetDesc = otpChannel === 'email' ? (email.trim() || 'your email') : 'your phone';
              setError(`We just sent a 6-digit confirmation code to ${targetDesc} via ${chName}. Enter it below to activate your account.`);
            }
            setIsLoading(false);
            return;
          } else {
            const chName = otpChannel === 'email' ? 'Email' : (otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS');
            const targetDesc = otpChannel === 'email' ? 'email' : 'phone';
            setError(`Please enter and verify the 6-digit code sent to your ${targetDesc} via ${chName}.`);
            setIsLoading(false);
            return;
          }
        }

        let computedHandle = burnerHandle.trim().replace(/^@/, '');
        if (!computedHandle) {
          if (accountType === 'store' && businessName.trim()) {
            computedHandle = businessName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20);
          } else if (fullName.trim()) {
            computedHandle = fullName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20);
          }
        }

        const payload = {
          email: email.trim(),
          password,
          phone: phone.trim(),
          account_type: accountType,
          name: fullName.trim() || undefined,
          business_name: accountType === 'store' ? businessName.trim() : undefined,
          business_category: accountType === 'store' ? (businessCategory || 'Other') : undefined,
          business_description: accountType === 'store' ? businessDescription.trim() : undefined,
          business_address: accountType === 'store' ? businessAddress.trim() : undefined,
          business_whatsapp: accountType === 'store' ? (businessWhatsapp.trim() || phone.trim()) : undefined,
          business_instagram: accountType === 'store' ? businessInstagram.trim().replace(/^@/, '') : undefined,
          campus_id: campusId || undefined,
          burner_handle: computedHandle || undefined,
          profile: { burner_handle: computedHandle || `user_${Math.floor(1000 + Math.random() * 9000)}` }
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

        {/* FORGOT PASSWORD VIEW */}
        {isForgotPassword ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setOtpMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brandblue)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0
                }}
              >
                <i className="fa-solid fa-arrow-left" />
                <span>Back to Login</span>
              </button>

              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Account Recovery
              </span>
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
              Forgot Password?
            </h2>

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.86rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}>
              Enter your registered phone number to receive a 6-digit recovery code via SMS or WhatsApp.
            </p>

            {error && (
              <div style={{
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                padding: '0.8rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                lineHeight: '1.4',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lightblue)',
                  color: 'var(--brandblue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-circle-info" />
                </div>
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {otpMessage && (
              <div style={{
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                padding: '0.8rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                lineHeight: '1.4',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-check" />
                </div>
                <span style={{ fontWeight: '500' }}>{otpMessage}</span>
              </div>
            )}

            {/* Step 1: Request Recovery OTP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Registered Email or Phone Number</label>
                
                {/* Channel toggle for forgot password: Email, WhatsApp, SMS */}
                <div style={{
                  display: 'flex',
                  gap: '0.35rem',
                  marginBottom: '0.65rem',
                  backgroundColor: 'var(--bg-color)',
                  padding: '0.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <button
                    type="button"
                    onClick={() => setForgotChannel('email')}
                    style={{
                      flex: 1.2,
                      padding: '0.45rem 0.4rem',
                      borderRadius: '9px',
                      border: 'none',
                      backgroundColor: forgotChannel === 'email' ? 'var(--brandblue)' : 'transparent',
                      color: forgotChannel === 'email' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: forgotChannel === 'email' ? '700' : '500',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      boxShadow: forgotChannel === 'email' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className="fa-solid fa-envelope" style={{ fontSize: '0.85rem' }} />
                    <span>Email OTP (Instant)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotChannel('whatsapp')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.4rem',
                      borderRadius: '9px',
                      border: 'none',
                      backgroundColor: forgotChannel === 'whatsapp' ? '#25D366' : 'transparent',
                      color: forgotChannel === 'whatsapp' ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: forgotChannel === 'whatsapp' ? '700' : '500',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      boxShadow: forgotChannel === 'whatsapp' ? '0 2px 8px rgba(37,211,102,0.3)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: '0.85rem' }} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotChannel('sms')}
                    style={{
                      flex: 0.9,
                      padding: '0.45rem 0.4rem',
                      borderRadius: '9px',
                      border: 'none',
                      backgroundColor: forgotChannel === 'sms' ? 'var(--surface)' : 'transparent',
                      color: forgotChannel === 'sms' ? 'var(--brandblue)' : 'var(--text-muted)',
                      fontWeight: forgotChannel === 'sms' ? '700' : '500',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      boxShadow: forgotChannel === 'sms' ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className="fa-solid fa-comment-sms" />
                    <span>SMS</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="form-input"
                    type={forgotChannel === 'email' ? 'email' : 'text'}
                    required
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder={forgotChannel === 'email' ? 'e.g. student@leadcity.edu.ng' : 'e.g. 08012345678 or email'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleForgotSendOtp}
                    disabled={isForgotSending || forgotCooldown > 0}
                    style={{
                      padding: '0.55rem 0.95rem',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: '700',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: forgotCooldown > 0 ? 'var(--surface-alt)' : (forgotChannel === 'whatsapp' ? '#25D366' : 'var(--brandblue)'),
                      color: forgotCooldown > 0 ? 'var(--text-muted)' : '#ffffff',
                      cursor: (isForgotSending || forgotCooldown > 0) ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {isForgotSending ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" />
                        <span>Sending...</span>
                      </>
                    ) : forgotCooldown > 0 ? (
                      <span>Resend ({forgotCooldown}s)</span>
                    ) : (
                      <span>{isForgotOtpSent ? 'Resend' : 'Send Code'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Code and New Password Entry */}
              {isForgotOtpSent && (
                <form onSubmit={handleForgotReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
                  <div style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Enter 6-Digit Recovery Code
                      </label>
                    </div>
                    <input
                      className="form-input"
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      style={{
                        textAlign: 'center',
                        letterSpacing: '0.3rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: '800',
                        fontSize: '1.25rem'
                      }}
                    />

                  </div>

                  <div>
                    <label className="form-label">Create New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        type={showForgotPw ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPw(!showForgotPw)}
                        style={{
                          position: 'absolute',
                          right: '0.85rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.88rem'
                        }}
                      >
                        <i className={showForgotPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Error/Success feedback right above action button */}
                  {error && (
                    <div style={{
                      color: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.84rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ flexShrink: 0 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  {otpMessage && (
                    <div style={{
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.84rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      lineHeight: '1.4'
                    }}>
                      <i className="fa-solid fa-circle-check" style={{ flexShrink: 0 }} />
                      <span>{otpMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isForgotResetting}
                    style={{ width: '100%', padding: '0.85rem' }}
                  >
                    {isForgotResetting ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-shield-halved" />
                        <span>Reset Password & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD LOGIN & SIGN UP VIEW */
          <>
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
                : 'Protect the campus marketplace. Verify your phone via SMS or WhatsApp.'}
            </p>

            {error && (
              <div style={{
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                padding: '0.8rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                lineHeight: '1.4',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lightblue)',
                  color: 'var(--brandblue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-circle-info" />
                </div>
                <span style={{ fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {otpMessage && (
              <div style={{
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                padding: '0.8rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                lineHeight: '1.4',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-check" />
                </div>
                <span style={{ fontWeight: '500' }}>{otpMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {!isLogin && (
                <div>
                  <label className="form-label" style={{ marginBottom: '0.45rem' }}>Account Type</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.65rem'
                  }}>
                    {/* Individual Student Option */}
                    <button
                      type="button"
                      onClick={() => setAccountType('individual')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.85rem 0.95rem',
                        borderRadius: '16px',
                        border: accountType === 'individual' ? '2px solid var(--terracotta)' : '1px solid var(--border)',
                        backgroundColor: accountType === 'individual' ? 'var(--surface)' : 'var(--surface-alt)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: accountType === 'individual' ? '0 4px 12px rgba(200, 122, 91, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>👤</span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          backgroundColor: accountType === 'individual' ? 'var(--terracotta)' : 'var(--border)',
                          color: accountType === 'individual' ? '#fff' : 'var(--text-muted)',
                          borderRadius: '9999px',
                          padding: '2px 7px'
                        }}>
                          Student
                        </span>
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        Individual
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        Sell personal gear, books & pre-owned items
                      </span>
                    </button>

                    {/* Campus Store Option */}
                    <button
                      type="button"
                      onClick={() => setAccountType('store')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.85rem 0.95rem',
                        borderRadius: '16px',
                        border: accountType === 'store' ? '2px solid var(--terracotta)' : '1px solid var(--border)',
                        backgroundColor: accountType === 'store' ? 'var(--surface)' : 'var(--surface-alt)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: accountType === 'store' ? '0 4px 12px rgba(200, 122, 91, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🏬</span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          backgroundColor: accountType === 'store' ? 'var(--terracotta)' : 'var(--border)',
                          color: accountType === 'store' ? '#fff' : 'var(--text-muted)',
                          borderRadius: '9999px',
                          padding: '2px 7px'
                        }}>
                          Business
                        </span>
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        Campus Store
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                        Student business, thrift brand, tech or snacks
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">
                  {isLogin ? "Email or Phone Number" : "Email Address"}
                </label>
                <input 
                  className="form-input"
                  type={isLogin ? "text" : "email"} 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin ? "e.g. 08012345678 or student@domain.com" : "e.g. student@university.edu.ng"}
                  autoComplete={isLogin ? "username" : "email"}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setOtpMessage('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brandblue)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
                  {accountType === 'store' ? (
                    <div style={{
                      backgroundColor: 'var(--surface-alt)',
                      padding: '1.1rem',
                      borderRadius: '18px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.15rem' }}>🏬</span>
                        <span style={{ fontWeight: '700', fontSize: '0.94rem', color: 'var(--text-main)' }}>
                          Campus Store Business Profile
                        </span>
                      </div>

                      {/* Real Business Name (Required) */}
                      <div>
                        <label className="form-label">
                          Real Business / Store Name <span style={{ color: 'var(--terracotta)' }}>*</span>
                        </label>
                        <input
                          className="form-input"
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => {
                            setBusinessName(e.target.value);
                            if (!burnerHandle) {
                              const autoHandle = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20);
                              setBurnerHandle(autoHandle);
                            }
                          }}
                          placeholder="e.g. Kev's Campus Thrifts, Bella Wears, GadgetPlug"
                        />
                      </div>

                      {/* Store Owner Real Name (Required) */}
                      <div>
                        <label className="form-label">
                          Owner&apos;s Real Name (Contact Person) <span style={{ color: 'var(--terracotta)' }}>*</span>
                        </label>
                        <input
                          className="form-input"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Tope Bayo (Your full name)"
                        />
                      </div>

                      {/* Business Category */}
                      <div>
                        <label className="form-label">Store Category</label>
                        <select
                          className="form-input"
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                          style={{ cursor: 'pointer' }}
                        >
                          {STORE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Store Tagline / Description */}
                      <div>
                        <label className="form-label">Store Tagline / Description (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          placeholder="e.g. Premium thrift fits & shoes. Daily hostel delivery."
                        />
                      </div>

                      {/* Store Pickup / Hostel Location */}
                      <div>
                        <label className="form-label">Store Pickup / Hostel Spot (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="e.g. Achievers Hall Room B12 or Sub Car Park"
                        />
                      </div>

                      {/* Instagram / Social Handle */}
                      <div>
                        <label className="form-label">Instagram / TikTok Handle (Optional)</label>
                        <input
                          className="form-input"
                          type="text"
                          value={businessInstagram}
                          onChange={(e) => setBusinessInstagram(e.target.value)}
                          placeholder="e.g. @kevs_thrifts"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Individual Student Account Name */
                    <div>
                      <label className="form-label">Full Name (Optional)</label>
                      <input
                        className="form-input"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ayomide Adeleke"
                      />
                    </div>
                  )}

                  {/* Campus / University Selector */}
                  <div>
                    <label className="form-label">Campus / Institution</label>
                    <select
                      className="form-input"
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      {campuses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.acronym || c.state})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Phone Verification Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Phone Number {isPhoneVerified ? '(Verified)' : `(${otpChannel === 'email' ? 'Email OTP' : (otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS')})`}
                      </label>
                      {isPhoneVerified && (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="fa-solid fa-circle-check" /> Verified
                        </span>
                      )}
                    </div>

                    {/* Delivery Channel Selector */}
                    {!isPhoneVerified && (
                      <div style={{
                        display: 'flex',
                        gap: '0.35rem',
                        marginBottom: '0.5rem',
                        backgroundColor: 'var(--bg-color)',
                        padding: '0.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                      }}>
                        <button
                          type="button"
                          onClick={() => setOtpChannel('email')}
                          style={{
                            flex: 1.2,
                            padding: '0.45rem 0.4rem',
                            borderRadius: '9px',
                            border: 'none',
                            backgroundColor: otpChannel === 'email' ? 'var(--brandblue)' : 'transparent',
                            color: otpChannel === 'email' ? '#ffffff' : 'var(--text-muted)',
                            fontWeight: otpChannel === 'email' ? '700' : '500',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: otpChannel === 'email' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-solid fa-envelope" style={{ fontSize: '0.85rem' }} />
                          <span>Email OTP (Instant)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpChannel('whatsapp')}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.4rem',
                            borderRadius: '9px',
                            border: 'none',
                            backgroundColor: otpChannel === 'whatsapp' ? '#25D366' : 'transparent',
                            color: otpChannel === 'whatsapp' ? '#ffffff' : 'var(--text-muted)',
                            fontWeight: otpChannel === 'whatsapp' ? '700' : '500',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: otpChannel === 'whatsapp' ? '0 2px 8px rgba(37,211,102,0.3)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-brands fa-whatsapp" style={{ fontSize: '0.85rem' }} />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpChannel('sms')}
                          style={{
                            flex: 0.9,
                            padding: '0.45rem 0.4rem',
                            borderRadius: '9px',
                            border: 'none',
                            backgroundColor: otpChannel === 'sms' ? 'var(--surface)' : 'transparent',
                            color: otpChannel === 'sms' ? 'var(--brandblue)' : 'var(--text-muted)',
                            fontWeight: otpChannel === 'sms' ? '700' : '500',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            boxShadow: otpChannel === 'sms' ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-solid fa-comment-sms" />
                          <span>SMS</span>
                        </button>
                      </div>
                    )}

                    {!isPhoneVerified && otpChannel === 'email' && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--brandblue)', margin: '0 0 0.5rem 0.2rem', fontWeight: '500' }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: '0.35rem' }} />
                        Verification code will be sent to <strong>{email.trim() || 'your email entered above'}</strong>
                      </p>
                    )}

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
                          onClick={() => handleSendOtp(phone, otpChannel)}
                          disabled={isSendingOtp || resendCooldown > 0}
                          style={{
                            padding: '0.55rem 0.95rem',
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: resendCooldown > 0 ? 'var(--surface-alt)' : (otpChannel === 'whatsapp' ? '#25D366' : 'var(--brandblue)'),
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
                            Enter 6-Digit {otpChannel === 'email' ? 'Email' : (otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS')} Code {otpChannel === 'email' && '(Check inbox/spam)'}
                          </span>
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
                    <label className="form-label">
                      {accountType === 'store' ? 'Store Handle / Username' : 'Burner Handle (Public Alias)'}
                    </label>
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
                        placeholder={accountType === 'store' ? 'e.g. kevs_thrifts' : 'e.g. ayo_student'}
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
                  isLogin 
                    ? 'Log In to CampusStash' 
                    : (accountType === 'store' ? 'Complete Verification & Launch Store' : 'Complete Verification & Sign Up')
                )}
              </button>
            </form>
          </>
        )}

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
