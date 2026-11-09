import React, { useState, useEffect } from 'react';
import { setAppTheme, getAppTheme, getThemePreference } from './ThemeToggleBtn';
import { apiFetch } from '../api';

function SettingsModal({ isOpen, onClose, onLogout, userProfile, onUpdateUser, defaultTab = 'appearance' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

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

  // Stored Theme Preference: 'system' | 'light' | 'dark'
  const [themePref, setThemePref] = useState(() => getThemePreference());

  useEffect(() => {
    const handleSync = () => {
      setThemePref(getThemePreference());
    };
    window.addEventListener('campus:theme_change', handleSync);
    return () => window.removeEventListener('campus:theme_change', handleSync);
  }, []);

  const [cacheCleared, setCacheCleared] = useState(false);

  // Account deletion state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultTab) setActiveTab(defaultTab);
      setPwMessage({ text: '', type: '' });
      setAccountMessage({ text: '', type: '' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCacheCleared(false);
      setThemePref(getThemePreference());

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountMessage({ text: '', type: '' });
    if (!phone.trim()) {
      setAccountMessage({ text: 'Phone number cannot be empty.', type: 'error' });
      return;
    }
    setAccountLoading(true);
    try {
      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
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
    if (newPassword.length < 8) {
      setPwMessage({ text: 'New password must be at least 8 characters.', type: 'error' });
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

  const handleThemeChange = (newPref) => {
    setThemePref(newPref);
    setAppTheme(newPref);
  };

  const handleClearCache = () => {
    localStorage.removeItem('cached_listings');
    localStorage.removeItem('cached_inbox');
    sessionStorage.removeItem('cs_cached_saved_items');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await apiFetch('/users/me', {
        method: 'DELETE'
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cached_listings');
      localStorage.removeItem('cached_inbox');
      setIsConfirmDeleteOpen(false);
      onClose();
      window.location.href = '/auth';
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          borderRadius: '26px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}>
              <i className="fa-solid fa-sliders" />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
                margin: 0
              }}>
                Settings & Preferences
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Theme, account, alerts & phone sync
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-alt)',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
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
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '6px 12px',
          gap: '6px'
        }}>
          {[
            { id: 'appearance', label: 'Theme & Sync', icon: 'fa-palette' },
            { id: 'account', label: 'Profile', icon: 'fa-user' },
            { id: 'security', label: 'Security', icon: 'fa-lock' },
            { id: 'notifications', label: 'Alerts', icon: 'fa-bell' },
            { id: 'safety', label: 'Safety', icon: 'fa-shield-halved' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minWidth: '95px',
                  padding: '0.6rem 0.65rem',
                  border: 'none',
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 3px 10px var(--primary-light)' : 'none',
                  whiteSpace: 'nowrap'
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
          {/* TAB 0: THEME / APPEARANCE (SYSTEM DARK MODE SYNC) */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '1.1rem', 
                  fontWeight: '800', 
                  color: 'var(--text-main)', 
                  margin: '0 0 0.35rem 0' 
                }}>
                  Appearance & Theme Sync
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                  Sync CampusStash seamlessly with your device's light or dark mode, or lock in your preferred look.
                </p>
              </div>

              {/* Theme Options Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* 1. System Auto Sync */}
                <div
                  onClick={() => handleThemeChange('system')}
                  style={{
                    padding: '1.1rem 1.15rem',
                    borderRadius: '20px',
                    border: themePref === 'system' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: themePref === 'system' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: themePref === 'system' ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      backgroundColor: themePref === 'system' ? 'var(--primary)' : 'var(--surface-alt)',
                      color: themePref === 'system' ? '#FFFFFF' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <i className="fa-solid fa-circle-half-stroke" />
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '800', 
                        fontSize: '0.94rem', 
                        color: 'var(--text-main)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem' 
                      }}>
                        <span>System Auto Sync</span>
                        <span style={{
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          fontSize: '0.62rem',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}>
                          Recommended
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>
                        Automatically adapts when your phone toggles dark or light mode
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${themePref === 'system' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: themePref === 'system' ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    flexShrink: 0
                  }}>
                    {themePref === 'system' && <i className="fa-solid fa-check" />}
                  </div>
                </div>

                {/* 2. Dark Mode */}
                <div
                  onClick={() => handleThemeChange('dark')}
                  style={{
                    padding: '1.1rem 1.15rem',
                    borderRadius: '20px',
                    border: themePref === 'dark' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: themePref === 'dark' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: themePref === 'dark' ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      backgroundColor: themePref === 'dark' ? 'var(--primary)' : 'var(--surface-alt)',
                      color: themePref === 'dark' ? '#FFFFFF' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <i className="fa-solid fa-moon" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.94rem', color: 'var(--text-main)' }}>
                        Dark Mode
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>
                        Deep obsidian forest theme with emerald glow
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${themePref === 'dark' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: themePref === 'dark' ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    flexShrink: 0
                  }}>
                    {themePref === 'dark' && <i className="fa-solid fa-check" />}
                  </div>
                </div>

                {/* 3. Light Mode */}
                <div
                  onClick={() => handleThemeChange('light')}
                  style={{
                    padding: '1.1rem 1.15rem',
                    borderRadius: '20px',
                    border: themePref === 'light' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: themePref === 'light' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: themePref === 'light' ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      backgroundColor: themePref === 'light' ? 'var(--primary)' : 'var(--surface-alt)',
                      color: themePref === 'light' ? '#FFFFFF' : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <i className="fa-solid fa-sun" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.94rem', color: 'var(--text-main)' }}>
                        Light Mode
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.4' }}>
                        Clean ivory canvas with fresh mint highlights
                      </div>
                    </div>
                  </div>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${themePref === 'light' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: themePref === 'light' ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    flexShrink: 0
                  }}>
                    {themePref === 'light' && <i className="fa-solid fa-check" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ACCOUNT / PROFILE */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Student Identity
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Manage your anonymous campus handle and contact details.
                </p>
              </div>

              {accountMessage.text && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: accountMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: accountMessage.type === 'success' ? '#10B981' : '#EF4444',
                  border: `1px solid ${accountMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                }}>
                  <i className={`fa-solid ${accountMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ marginRight: '0.45rem' }} />
                  {accountMessage.text}
                </div>
              )}

              <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Burner Handle / Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontWeight: '700'
                    }}>
                      @
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      value={handle}
                      disabled
                      placeholder="e.g. shadow99"
                      style={{ paddingLeft: '2.2rem', backgroundColor: 'var(--surface-alt)', opacity: 0.85, cursor: 'not-allowed' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                    <i className="fa-solid fa-lock" /> Permanent username (verified on campus)
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    disabled
                    placeholder="e.g. 08012345678"
                    style={{ backgroundColor: 'var(--surface-alt)', opacity: 0.85, cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                    <i className="fa-solid fa-shield-halved" /> Phone verified for student trust & scam prevention
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Full / Display Name (Optional)
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
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
                  disabled={accountLoading}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    marginTop: '0.5rem',
                    cursor: accountLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {accountLoading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>

              {/* Danger Zone: Account Deletion */}
              <div style={{
                marginTop: '1.25rem',
                padding: '1.1rem',
                borderRadius: '18px',
                border: '1px solid #FECACA',
                backgroundColor: 'rgba(239, 68, 68, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#DC2626', fontSize: '0.95rem' }} />
                  <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#DC2626' }}>
                    Danger Zone: Delete Account
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 0.85rem 0' }}>
                  Permanently delete your profile, listings, and messages. This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    borderRadius: '9999px',
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className="fa-solid fa-trash-can" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Change Password
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Update your password to keep your student account and chats safe.
                </p>
              </div>

              {pwMessage.text && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: pwMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: pwMessage.type === 'success' ? '#10B981' : '#EF4444',
                  border: `1px solid ${pwMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                }}>
                  <i className={`fa-solid ${pwMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} style={{ marginRight: '0.45rem' }} />
                  {pwMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    cursor: pwLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px var(--primary-light)',
                    marginTop: '0.5rem'
                  }}
                >
                  {pwLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              {/* Cache Maintenance */}
              <div style={{
                marginTop: '1.25rem',
                padding: '1.1rem',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    App Cache & Offline Storage
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Clear saved cache if images or messages seem stale
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cacheCleared ? 'Cleared ✓' : 'Clear Cache'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ALERTS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Notification Preferences
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Manage notifications and real-time alerts.
                </p>
              </div>

              {[
                { label: 'Chat Messages', desc: 'Receive alerts when buyers or sellers message you', checked: notifyMessages, toggle: toggleNotifyMessages },
                { label: 'Meetup Proposals & Dropzones', desc: 'Alerts when someone suggests or agrees to a meetup spot', checked: notifyMeetups, toggle: toggleNotifyMeetups },
                { label: 'Price Drops & Catalog Drops', desc: 'Highlights for popular student items in your campus', checked: notifyDeals, toggle: toggleNotifyDeals }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.15rem',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '18px',
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={item.toggle}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SAFETY */}
          {activeTab === 'safety' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                  Campus Safety Guidelines
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Always protect yourself and your money on campus.
                </p>
              </div>

              {[
                { icon: 'fa-location-dot', title: 'Campus Safe Dropzones', text: 'Always meet in open, well-lit public spots like the campus library, cafeteria, or hostel reception.' },
                { icon: 'fa-user-shield', title: 'Anonymous Chat Masking', text: 'Keep conversations inside CampusStash. Never share personal home addresses or banking OTPs.' },
                { icon: 'fa-handshake', title: 'Inspect Before Payment', text: 'Carefully test textbooks, laptops, phones, and items in person before completing any payment.' }
              ].map((rule, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '1rem',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: '18px',
                  border: '1px solid var(--border)',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1rem'
                  }}>
                    <i className={`fa-solid ${rule.icon}`} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)' }}>
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

        {/* Delete Account Confirmation Modal */}
        {isConfirmDeleteOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div className="animate-fade-in" style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              padding: '1.75rem',
              maxWidth: '420px',
              width: '100%',
              border: '1px solid #FCA5A5',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1rem auto'
              }}>
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.25rem', color: '#DC2626', margin: '0 0 0.5rem 0' }}>
                Delete Account Permanently?
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
                Are you sure? All your active campus listings, reviews, and chats will be immediately and irreversibly wiped.
              </p>
              
              {deleteError && (
                <div style={{ color: '#DC2626', fontSize: '0.82rem', marginBottom: '0.85rem', fontWeight: '700' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => { setIsConfirmDeleteOpen(false); setDeleteError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '0.86rem',
                    cursor: isDeleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info & Logout button */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: '0.84rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
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
