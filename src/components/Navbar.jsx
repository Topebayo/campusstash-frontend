import SettingsModal from './SettingsModal';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';


function playNotificationPing() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch (e) {
    // Ignore audio restrictions
  }
}


async function triggerNotification(title, body) {
  playNotificationPing();
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'CampusStash: New Message',
            body: body || 'You received a new message regarding a listing',
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 50) }
          }
        ]
      });
    } catch (e) {
      console.warn('Native notification error:', e);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title || 'CampusStash: New Message', {
        body: body || 'You received a new message regarding a listing',
        icon: '/favicon.svg'
      });
    } catch (e) {}
  }
}

function Navbar({ onPrimaryAction, primaryActionText }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'system');
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [location.pathname]);

  // Request notification permissions for background messaging & alerts
  useEffect(() => {
    if (token) {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.requestPermissions().catch(() => {});
      } else if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
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
            if (total > prev) {
              triggerNotification(
                'CampusStash: New Message',
                `You have ${total} unread message(s)`
              );
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
      <header className="main-navbar-header" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="navbar-container" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0.65rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', boxSizing: 'border-box' }}>
          
          {/* Brand Logo & Back Button Group */}
          <div className="navbar-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexShrink: 1 }}>
            {!isHome && (
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '20px',
                  backgroundColor: 'var(--lightblue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--brandblue)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Go Back"
              >
                <i className="fa-solid fa-arrow-left" />
                <span className="desktop-label">{isProfile ? 'Market' : 'Back'}</span>
              </button>
            )}

            <div 
              onClick={() => navigate('/dashboard')}
              className="brand-logo"
              style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              Campus<span className="text-brandblue">Stash</span>
            </div>

            {/* Desktop Navigation Links */}
            {!isProfile && (
              <nav className="desktop-nav-links" style={{ marginLeft: '0.75rem', display: 'flex', gap: '0.4rem' }}>
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
            )}
          </div>

          {/* Action Buttons & Theme Toggle */}
          <div className="navbar-action-group" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            <button
              onClick={cycleTheme}
              title={`Theme: ${themeMode}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <i className={themeMode === 'dark' ? "fa-solid fa-moon" : themeMode === 'light' ? "fa-solid fa-sun" : "fa-solid fa-desktop"} style={{ color: 'var(--brandblue)' }} />
              <span className="desktop-label" style={{ textTransform: 'capitalize' }}>{themeMode}</span>
            </button>

            {token && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Settings & Security"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-gear" style={{ color: 'var(--brandblue)' }} />
                <span className="desktop-label">Settings</span>
              </button>
            )}

            {token ? (
              <button
                onClick={handleLogout}
                title="Log Out of Account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-right-from-bracket" />
                <span className="desktop-label">Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
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
                <span className="desktop-label">Sign In</span>
              </button>
            )}

            {!isProfile && onPrimaryAction && primaryActionText && (
              <button 
                className="btn-primary desktop-sell-btn" 
                onClick={onPrimaryAction}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                <i className="fa-solid fa-plus" />
                <span>{primaryActionText}</span>
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

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onLogout={handleLogout} 
      />
    </>
  );
}

export default Navbar;

