import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ onPrimaryAction, primaryActionText }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme') || 'system');
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of CampusStash?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      navigate('/auth');
    }
  };

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';

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
          {/* Brand Logo & Back Button Group */}
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
                  color: 'var(--darkblue)',
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
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

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

            {onPrimaryAction && primaryActionText && (
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
              <i className={link.icon} />
              <span>{link.label}</span>
            </button>
          );
        })}
        {onPrimaryAction && (
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
