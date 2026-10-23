import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

function SettingsModal({ isOpen, onClose, onLogout, userProfile, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'security' | 'notifications' | 'appearance' | 'safety'

  // Account Profile state
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ text: '', type: '' });
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  // Notifications state (persisted in localStorage)
  const [notifyMessages, setNotifyMessages] = useState(() => {
    return localStorage.getItem('cs_pref_notify_messages') !== 'false';
  });
  const [notifyMeetups, setNotifyMeetups] = useState(() => {
    return localStorage.getItem('cs_pref_notify_meetups') !== 'false';
  });
  const [notifyDeals, setNotifyDeals] = useState(() => {
    return localStorage.getItem('cs_pref_notify_deals') !== 'false';
  });

  // Theme state
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPwMessage({ text: '', type: '' });
      setAccountMessage({ text: '', type: '' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCacheCleared(false);

      if (userProfile) {
        setHandle(userProfile.profile?.burner_handle || '');
        setPhone(userProfile.phone || '');
        setName(userProfile.name || '');
        setEmail(userProfile.email || '');
      }
      
      apiFetch('/users/me')
        .then(data => {
          if (data) {
            setHandle(data.profile?.burner_handle || '');
            setPhone(data.phone || '');
            setName(data.name || '');
            setEmail(data.email || '');
          }
        })
        .catch(err => console.warn('Could not load user profile in settings:', err));
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountMessage({ text: '', type: '' });
    if (!handle.trim()) {
      setAccountMessage({ text: 'Username / Burner Handle cannot be empty.', type: 'error' });
      return;
    }
    if (!phone.trim()) {
      setAccountMessage({ text: 'Phone number cannot be empty.', type: 'error' });
      return;
    }
    setAccountLoading(true);
    try {
      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          burner_handle: handle.trim(),
          phone: phone.trim(),
          name: name.trim() || null
        })
      });
      setAccountMessage({ text: 'Profile updated successfully!', type: 'success' });
      setHandle(updated.profile?.burner_handle || handle.trim());
      setPhone(updated.phone || phone.trim());
      setName(updated.name || '');
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
    } catch (err) {
      setAccountMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage({ text: '', type: '' });

    if (!currentPassword) {
      setPwMessage({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setPwLoading(true);
    try {
      await apiFetch('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      setPwMessage({ text: 'Password successfully updated!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMessage({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPwLoading(false);
    }
  };

  const toggleNotifyMessages = () => {
    const val = !notifyMessages;
    setNotifyMessages(val);
    localStorage.setItem('cs_pref_notify_messages', String(val));
  };

  const toggleNotifyMeetups = () => {
    const val = !notifyMeetups;
    setNotifyMeetups(val);
    localStorage.setItem('cs_pref_notify_meetups', String(val));
  };

  const toggleNotifyDeals = () => {
    const val = !notifyDeals;
    setNotifyDeals(val);
    localStorage.setItem('cs_pref_notify_deals', String(val));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleClearCache = () => {
    localStorage.removeItem('cached_listings');
    localStorage.removeItem('cached_inbox');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999
      }}
    >
      <div 
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--lightblue)',
              color: 'var(--brandblue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}>
              <i className="fa-solid fa-gear" />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                margin: 0
              }}>
                Settings & Preferences
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Account security, alerts & app settings
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'account', label: 'Account', icon: 'fa-user' },
            { id: 'security', label: 'Security', icon: 'fa-lock' },
            { id: 'notifications', label: 'Alerts', icon: 'fa-bell' },
            { id: 'appearance', label: 'Theme', icon: 'fa-palette' },
            { id: 'safety', label: 'Safety', icon: 'fa-shield-halved' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minWidth: '85px',
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  borderBottom: isActive ? '2.5px solid var(--brandblue)' : '2.5px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? 'var(--brandblue)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className={`fa-solid ${tab.icon}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* TAB 0: ACCOUNT / PROFILE */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Student Profile & Identity
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Update your anonymous campus handle, phone number, and account details.
                </p>
              </div>

              {accountMessage.text && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: accountMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: accountMessage.type === 'success' ? '#16a34a' : '#ef4444',
                  border: `1px solid ${accountMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
                }}>
                  <i className={`fa-solid ${accountMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ marginRight: '0.45rem' }} />
                  {accountMessage.text}
                </div>
              )}

              <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Burner Handle / Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-light)',
                      fontWeight: '700'
                    }}>
                      @
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. shadow99"
                      style={{ paddingLeft: '2.2rem' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    This is your public alias shown on item listings and chats.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Used for SMS security and verified buyer/seller badge.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Adebayo"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Registered Email (Read-only)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    disabled
                    style={{ backgroundColor: 'var(--surface-alt)', opacity: 0.75, cursor: 'not-allowed' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={accountLoading}
                  style={{
                    padding: '0.8rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {accountLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 1: SECURITY (Change Password & Session) */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Change Password
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Update your credentials to keep your student account and chats safe.
                </p>
              </div>

              {pwMessage.text && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: pwMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: pwMessage.type === 'success' ? '#16a34a' : '#ef4444',
                  border: `1px solid ${pwMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
                }}>
                  <i className={`fa-solid ${pwMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ marginRight: '0.45rem' }} />
                  {pwMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    minLength={6}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                  <input 
                    type="checkbox" 
                    checked={showPassword} 
                    onChange={(e) => setShowPassword(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--brandblue)' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Show passwords</span>
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="btn-primary"
                  style={{ marginTop: '0.5rem', padding: '0.75rem', width: '100%', fontSize: '0.9rem' }}
                >
                  {pwLoading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin" /> Updating Password...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-key" /> Update Password
                    </>
                  )}
                </button>
              </form>

              {/* Data & Cache Action */}
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                    App Cache & Synced Storage
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Clear local storage to refresh listings & chats
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  {cacheCleared ? 'Cleared ✓' : 'Clear Cache'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Notification Preferences
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Control when and how you receive real-time campus alerts.
                </p>
              </div>

              {/* Toggle 1: Messages */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                    Chat Messages
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Receive alerts when buyers or sellers send messages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMessages}
                  onChange={toggleNotifyMessages}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--brandblue)' }}
                />
              </div>

              {/* Toggle 2: Meetups */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                    Meetup Proposals & Dropzone Alerts
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Get notified when someone suggests or agrees to a meetup spot
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMeetups}
                  onChange={toggleNotifyMeetups}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--brandblue)' }}
                />
              </div>

              {/* Toggle 3: Deals */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '16px',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                    Price Drops & New Campus Gear
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Highlights for popular student items in your campus
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDeals}
                  onChange={toggleNotifyDeals}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--brandblue)' }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: THEME / APPEARANCE */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Interface Theme
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Choose your preferred color mode for study sessions and night browsing.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div
                  onClick={() => handleThemeChange('light')}
                  style={{
                    padding: '1.25rem 1rem',
                    borderRadius: '16px',
                    border: '2px solid',
                    borderColor: theme === 'light' ? 'var(--brandblue)' : 'var(--border)',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: theme === 'light' ? 'var(--shadow-blue)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className="fa-solid fa-sun" style={{ fontSize: '1.6rem', color: '#f59e0b', marginBottom: '0.5rem', display: 'block' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                    Light Mode
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Bright Royal & White
                  </div>
                </div>

                <div
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    padding: '1.25rem 1rem',
                    borderRadius: '16px',
                    border: '2px solid',
                    borderColor: theme === 'dark' ? 'var(--brandblue)' : 'var(--border)',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: theme === 'dark' ? 'var(--shadow-blue)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className="fa-solid fa-moon" style={{ fontSize: '1.6rem', color: '#60a5fa', marginBottom: '0.5rem', display: 'block' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                    Dark Mode
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                    Sleek Midnight Navy
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAFETY */}
          {activeTab === 'safety' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Campus Safety Guidelines
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Best practices for safe student-to-student transactions.
                </p>
              </div>

              {[
                { icon: 'fa-location-dot', title: 'Campus Safe Dropzones', text: 'Always meet in well-lit public spots like the campus library, cafeteria, or student union building.' },
                { icon: 'fa-user-shield', title: 'Anonymous Burner Masking', text: 'Keep conversations inside CampusStash chat. Never share personal home addresses or banking passwords.' },
                { icon: 'fa-handshake', title: 'Inspect Before Payment', text: 'Thoroughly examine textbooks, laptops, electronics, and accessories in person before completing deals.' }
              ].map((rule, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--lightblue)',
                    color: 'var(--brandblue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.9rem'
                  }}>
                    <i className={`fa-solid ${rule.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                      {rule.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: '0.15rem' }}>
                      {rule.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info & Logout button */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            CampusStash v2.0 • Release
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <i className="fa-solid fa-right-from-bracket" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
