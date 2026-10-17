import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';

function playNotificationPing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

function Navbar({ onPrimaryAction, primaryActionText }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'system');
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [unreadCount, setUnreadCount] = useState(0);

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [location.pathname]);

  // Request notification permissions for background messaging
  useEffect(() => {
    if (token && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [token]);

  // Poll for unread messages count every 10 seconds
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const checkUnread = async () => {
      try {
        let convs = [];
        try {
          convs = await apiFetch('/conversations');
        } catch (e) {
          convs = await apiFetch('/chat/inbox/me');
        }

        if (isMounted && Array.isArray(convs)) {
          const total = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          setUnreadCount(prev => {
            if (total > prev && prev !== 0) {
              playNotificationPing();
              if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('CampusStash: New Message', {
                  body: 'You received a new message regarding a listing',
                  icon: '/favicon.svg'
                });
              }
            }
            return total;
          });
        }
      } catch (err) {
        // Quiet failure on network timeout
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, location.pathname]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of CampusStash?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUnreadCount(0);
      navigate('/auth');
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const cycleTheme = () => {
    let nextTheme = 'light';
    if (themeMode === 'system') nextTheme = 'light';
    else if (themeMode === 'light') nextTheme = 'dark';
    else if (themeMode === 'dark') nextTheme = 'system';

    setThemeMode(nextTheme);
    localStorage.setItem('theme', nextTheme);

    if (nextTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  };

  const navLinks = [
    { label: 'Marketplace', path: '/dashboard', icon: 'fa-solid fa-store' },
    { label: 'Messages', path: '/messages', icon: 'fa-solid fa-comments' },
    { label: 'Profile', path: '/profile', icon: 'fa-solid fa-user-shield' }
  ];

  return (
    <>
      {/* Top Header Navigation (Desktop & Mobile) */}
      <header className="main-navbar-header">
        <div className="navbar-container">
          
          {/* Custom Header for Profile View */}
          {isProfile ? (
            <div className="navbar-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '20px',
                  backgroundColor: 'var(--lightblue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--brandblue)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Back to Marketplace"
              >
                <i className="fa-solid fa-arrow-left" />
                <span>Marketplace</span>
              </button>

              <div 
                onClick={() => navigate('/dashboard')}
                className="brand-logo"
                style={{ fontSize: '1.25rem' }}
              >
                Campus<span className="text-brandblue">Stash</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  marginLeft: '0.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Account
                </span>
              </div>
            </div>
          ) : (
            /* Standard Header for Marketplace & Messages */
            <div className="navbar-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {!isHome && (
                <button
                  onClick={handleBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '20px',
                    backgroundColor: 'var(--lightblue)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: 'var(--brandblue)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Go Back"
                >
                  <i className="fa-solid fa-arrow-left" />
                  <span>Back</span>
                </button>
              )}

              <div 
                onClick={() => navigate('/dashboard')}
                className="brand-logo"
              >
                Campus<span className="text-brandblue">Stash</span>
              </div>

              {/* Desktop Navigation Links */}
              <nav className="desktop-nav-links" style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`nav-pill ${isActive ? 'active' : ''}`}
                    >
                      <i className={link.icon} />
                      <span>{link.label}</span>
                      {link.path === '/messages' && unreadCount > 0 && (
                        <span className="nav-unread-badge">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Action Buttons & Theme Toggle */}
          <div className="navbar-action-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={cycleTheme}
              title={`Current Theme: ${themeMode.toUpperCase()} (Click to toggle)`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={themeMode === 'dark' ? "fa-solid fa-moon" : themeMode === 'light' ? "fa-solid fa-sun" : "fa-solid fa-desktop"} style={{ color: 'var(--brandblue)' }} />
              <span style={{ textTransform: 'capitalize' }}>{themeMode}</span>
            </button>

            {token ? (
              <button
                onClick={handleLogout}
                title="Log Out of Account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-right-from-bracket" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--brandblue)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-arrow-right-to-bracket" />
                <span>Sign In</span>
              </button>
            )}

            {!isProfile && onPrimaryAction && primaryActionText && (
              <button 
                className="btn-primary desktop-sell-btn" 
                onClick={onPrimaryAction}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.88rem',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                <i className="fa-solid fa-plus" />
                {primaryActionText}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock */}
      <nav className="mobile-bottom-dock">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`mobile-dock-item ${isActive ? 'active' : ''}`}
            >
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={link.icon} />
                {link.path === '/messages' && unreadCount > 0 && (
                  <span className="dock-badge-pill">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{link.label}</span>
            </button>
          );
        })}
        {!isProfile && onPrimaryAction && (
          <button 
            className="mobile-dock-sell-btn"
            onClick={onPrimaryAction}
            title="List Item"
          >
            <i className="fa-solid fa-plus" />
          </button>
        )}
      </nav>
    </>
  );
}

export default Navbar;
