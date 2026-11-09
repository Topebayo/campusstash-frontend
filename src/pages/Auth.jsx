import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getCampuses, DEFAULT_CAMPUSES, setActiveCampusId } from '../api';

function Auth() {
  const navigate = useNavigate();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [isForgotOtpSent, setIsForgotOtpSent] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  // Post-Login Campus Onboarding (if new user has no campus yet)
  const [showCampusOnboarding, setShowCampusOnboarding] = useState(false);
  const [campuses, setCampuses] = useState(() => {
    try {
      const cached = localStorage.getItem('campusstash_cached_campuses');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUSES;
    } catch (e) {
      return DEFAULT_CAMPUSES;
    }
  });
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [tempUser, setTempUser] = useState(null);

  // Load campuses
  useEffect(() => {
    getCampuses().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setCampuses(data);
        if (!selectedCampusId) setSelectedCampusId(data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Cooldown timer for forgot password
  useEffect(() => {
    let timer = null;
    if (forgotCooldown > 0) {
      timer = setInterval(() => setForgotCooldown(prev => prev - 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [forgotCooldown]);

  // Check for Google OAuth redirect callback (#access_token=...)
  useEffect(() => {
    if (window.location.hash.includes('access_token=')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(true);
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then(res => res.json())
            .then(async (googleProfile) => {
              if (googleProfile?.email) {
                const res = await apiFetch('/auth/google', {
                  method: 'POST',
                  body: JSON.stringify({
                    email: googleProfile.email,
                    name: googleProfile.name || googleProfile.email.split('@')[0],
                    picture: googleProfile.picture,
                    google_id: googleProfile.sub
                  })
                });
                handleAuthSuccess(res);
              }
            })
            .catch(err => {
              setError('Google login failed: ' + (err.message || 'Please try email sign in.'));
            })
            .finally(() => setIsLoading(false));
        }
      } catch (e) {}
    }
  }, []);

  // Initialize Google One-Tap / Google Identity Services
  useEffect(() => {
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            // Using a standard client ID or server client
            client_id: "713498836545-campusstash.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });
        } catch (e) {
          console.warn("GSI Init note:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGsi();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential })
      });
      handleAuthSuccess(res);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try email sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerGoogleAuth = () => {
    setError('');

    // 1. If Google Identity Services OAuth2 token client is available, trigger official popup
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: "713498836545-campusstash.apps.googleusercontent.com",
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setIsLoading(true);
              try {
                const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const googleProfile = await userInfoRes.json();
                if (googleProfile?.email) {
                  const res = await apiFetch('/auth/google', {
                    method: 'POST',
                    body: JSON.stringify({
                      email: googleProfile.email,
                      name: googleProfile.name || googleProfile.email.split('@')[0],
                      picture: googleProfile.picture,
                      google_id: googleProfile.sub
                    })
                  });
                  handleAuthSuccess(res);
                  return;
                }
              } catch (e) {
                console.error("Google userinfo fetch failed:", e);
                setError("Google sign-in could not complete profile retrieval.");
              } finally {
                setIsLoading(false);
              }
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn("initTokenClient fallback:", e);
      }
    }

    // 2. If GIS One-Tap prompt is ready, display it
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            handleGoogleOAuthRedirect();
          }
        });
        return;
      } catch (e) {}
    }

    // 3. Official Google OAuth 2.0 Web Redirect (Redirects to Google Sign-In page)
    handleGoogleOAuthRedirect();
  };

  const handleGoogleOAuthRedirect = () => {
    const clientId = "713498836545-campusstash.apps.googleusercontent.com";
    const redirectUri = window.location.origin + "/auth";
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  const handleAuthSuccess = (res) => {
    if (res?.access_token) {
      localStorage.setItem('token', res.access_token);
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        setTempUser(res.user);
        if (res.user.campus_id) {
          setActiveCampusId(res.user.campus_id);
          localStorage.setItem('campusstash_campus_id', res.user.campus_id);
          localStorage.setItem('campusstash_campus_selected', 'true');
        } else {
          setShowCampusOnboarding(true);
          return;
        }
      }
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const identifier = email.trim();
    const isEmail = identifier.includes('@');

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: isEmail ? identifier.toLowerCase() : identifier,
          phone: !isEmail ? identifier : undefined,
          username: identifier,
          password
        })
      });
      handleAuthSuccess(res);
    } catch (err) {
      setError(err.message || 'Invalid email/phone number or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: name.trim() || cleanEmail.split('@')[0],
          account_type: 'individual'
        })
      });
      handleAuthSuccess(res);
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid registered email address.');
      return;
    }
    setError('');
    setForgotSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          channel: 'email'
        })
      });
      setIsForgotOtpSent(true);
      setForgotSuccessMessage(res.message || 'Verification code sent to your email.');
      setForgotCooldown(60);
    } catch (err) {
      setError(err.message || 'Could not dispatch password recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp_code: forgotOtp.trim(),
          new_password: forgotNewPassword
        })
      });
      handleAuthSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCampusOnboarding = async () => {
    if (!selectedCampusId) return;
    setIsLoading(true);
    try {
      // Set active campus globally and persist keys
      setActiveCampusId(selectedCampusId);
      localStorage.setItem('campusstash_campus_id', selectedCampusId);
      localStorage.setItem('campusstash_user_campus', selectedCampusId);
      localStorage.setItem('campusstash_campus_selected', 'true');

      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ campus_id: selectedCampusId })
      });
      const cur = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...cur, ...(updated || {}), campus_id: selectedCampusId }));

      setShowCampusOnboarding(false);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setActiveCampusId(selectedCampusId);
      localStorage.setItem('campusstash_campus_id', selectedCampusId);
      localStorage.setItem('campusstash_user_campus', selectedCampusId);
      localStorage.setItem('campusstash_campus_selected', 'true');
      setShowCampusOnboarding(false);
      navigate('/dashboard', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#080E0B',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(14, 68, 52, 0.45) 0%, rgba(8, 14, 11, 0.98) 75%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      color: '#FFFFFF'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '410px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Brand Logo with Shopping Bag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '2rem',
          userSelect: 'none'
        }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)',
            color: '#FFFFFF'
          }}>
            ShopMate
          </span>
          <span style={{ fontSize: '1.4rem' }}>🛍️</span>
        </div>

        {/* Heading & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', width: '100%' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
            color: '#FFFFFF',
            fontFamily: 'var(--font-display)'
          }}>
            {mode === 'login' ? 'Welcome Back' : (mode === 'register' ? 'Create Account' : 'Reset Password')}
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: 'rgba(255, 255, 255, 0.65)',
            margin: 0,
            lineHeight: 1.45
          }}>
            {mode === 'login' 
              ? 'Sign in to continue your curated shopping experience.'
              : (mode === 'register' 
                  ? 'Join your campus marketplace to buy and sell gear fast.'
                  : 'Enter your registered email to reset your account credentials.')}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxSizing: 'border-box'
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {forgotSuccessMessage && (
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6EE7B7',
            padding: '0.75rem 1rem',
            borderRadius: '16px',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxSizing: 'border-box'
          }}>
            <i className="fa-solid fa-circle-check" style={{ flexShrink: 0 }} />
            <span>{forgotSuccessMessage}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {/* Email or Phone Number */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '0 1rem',
              transition: 'border-color 0.2s ease'
            }}>
              <i className="fa-regular fa-user" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem', marginRight: '0.75rem' }} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Phone Number"
                autoCapitalize="none"
                autoCorrect="off"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  padding: '1rem 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Password */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '0 1rem'
            }}>
              <i className="fa-solid fa-lock" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem', marginRight: '0.75rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  padding: '1rem 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {/* Forgot Password link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.2rem' }}>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: '600'
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#153A2C',
                backgroundImage: 'linear-gradient(180deg, #1A4D3B 0%, #103325 100%)',
                color: '#FFFFFF',
                fontSize: '0.98rem',
                fontWeight: '700',
                fontFamily: 'var(--font-display)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(16, 51, 37, 0.6), inset 0 1px 1px rgba(255,255,255,0.15)',
                marginTop: '0.5rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: CREATE ACCOUNT */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {/* Full / Display Name */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '0 1rem'
            }}>
              <i className="fa-regular fa-user" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1rem', marginRight: '0.75rem' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name / Display Name"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  padding: '1rem 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Email Address */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '0 1rem'
            }}>
              <i className="fa-regular fa-envelope" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1rem', marginRight: '0.75rem' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Student Email Address"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  padding: '1rem 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Password */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '0 1rem'
            }}>
              <i className="fa-solid fa-lock" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem', marginRight: '0.75rem' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create Password (min 8 chars)"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  padding: '1rem 0',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#153A2C',
                backgroundImage: 'linear-gradient(180deg, #1A4D3B 0%, #103325 100%)',
                color: '#FFFFFF',
                fontSize: '0.98rem',
                fontWeight: '700',
                fontFamily: 'var(--font-display)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(16, 51, 37, 0.6), inset 0 1px 1px rgba(255,255,255,0.15)',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isForgotOtpSent ? (
              <form onSubmit={handleSendForgotOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0 1rem'
                }}>
                  <i className="fa-regular fa-envelope" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1rem', marginRight: '0.75rem' }} />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter Registered Email"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      padding: '1rem 0',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || forgotCooldown > 0}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: '#153A2C',
                    backgroundImage: 'linear-gradient(180deg, #1A4D3B 0%, #103325 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: (isLoading || forgotCooldown > 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Sending Code...' : (forgotCooldown > 0 ? `Resend Code (${forgotCooldown}s)` : 'Send Recovery Code')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0 1rem'
                }}>
                  <i className="fa-solid fa-key" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem', marginRight: '0.75rem' }} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="6-Digit Verification Code"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      padding: '1rem 0',
                      fontSize: '0.92rem',
                      letterSpacing: '0.15em'
                    }}
                  />
                </div>

                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '0 1rem'
                }}>
                  <i className="fa-solid fa-lock" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem', marginRight: '0.75rem' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter New Password (min 8 chars)"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      padding: '1rem 0',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: '#153A2C',
                    backgroundImage: 'linear-gradient(180deg, #1A4D3B 0%, #103325 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset & Log In'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setForgotSuccessMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '0.25rem'
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Divider: Or Sign In With */}
        {mode !== 'forgot' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              margin: '1.75rem 0 1.25rem 0'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
              <span style={{
                padding: '0 0.85rem',
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.45)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
              }}>
                Or Sign In With
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
            </div>

            {/* Social Authentication: Google & Apple */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.85rem',
              width: '100%',
              marginBottom: '2rem'
            }}>
              {/* Google / Gmail Button */}
              <button
                type="button"
                onClick={handleTriggerGoogleAuth}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                {/* Google Multi-Color SVG Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => {
                  setError('Apple Sign-In is configured for the native iOS build. Please use Google / Gmail or Email to sign in now.');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  userSelect: 'none'
                }}
              >
                <i className="fa-brands fa-apple" style={{ fontSize: '1.2rem' }} />
                <span>Apple</span>
              </button>
            </div>

            {/* Bottom Mode Switcher */}
            <div style={{ textAlign: 'center' }}>
              {mode === 'login' ? (
                <span style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  New to ShopMate?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'none'
                    }}
                  >
                    Create an Account
                  </button>
                </span>
              ) : (
                <span style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'none'
                    }}
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* POST-LOGIN CAMPUS ONBOARDING MODAL (FOR GOOGLE & NEW USERS) */}
      {showCampusOnboarding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#111714',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '26px',
            padding: '1.75rem',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 1.1rem auto'
            }}>
              🎓
            </div>

            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              fontFamily: 'var(--font-display)',
              margin: '0 0 0.4rem 0',
              color: '#FFFFFF'
            }}>
              Which Campus Are You At?
            </h3>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.65)',
              margin: '0 0 1.25rem 0',
              lineHeight: 1.45
            }}>
              Personalize your campus marketplace to see student listings and hostel dropzones near you.
            </p>

            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Select Your University
              </label>
              <select
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {campuses.map(c => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#111714', color: '#FFFFFF' }}>
                    {c.acronym} — {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveCampusOnboarding}
              disabled={isLoading || !selectedCampusId}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#10B981',
                color: '#062419',
                fontSize: '0.95rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isLoading ? 'Saving...' : 'Enter Campus Marketplace →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;
