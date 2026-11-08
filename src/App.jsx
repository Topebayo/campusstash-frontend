import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Saved from './pages/Saved';
import Discover from './pages/Discover';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("UI Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-color)',
          color: 'var(--text-main)',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(200, 122, 91, 0.15)',
            color: '#C87A5B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            marginBottom: '1rem'
          }}>
            🎓
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.4rem' }}>
            CampusStash
          </h2>
          <p style={{ color: '#78716C', maxWidth: '340px', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.45' }}>
            {this.state.error?.message || 'A momentary view issue occurred. Tap below to reload your stash.'}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('cs_cached_listings');
                sessionStorage.clear();
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }
              } catch(e) {}
              window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
            }}
            style={{
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.75rem 1.6rem',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(200, 122, 91, 0.3)'
            }}
          >
            Reload CampusStash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    // Theme Sync: defaults to Aesthetic Minimal (light cream) unless explicitly set to dark
    // Suppress browser automatic install banners (e.g. Android Chrome infobar)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const getSystemTheme = () => {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      let effectiveTheme = 'light';
      if (savedTheme === 'dark' || savedTheme === 'light') {
        effectiveTheme = savedTheme;
      } else {
        // Defaults to user's phone / system dark mode automatically
        effectiveTheme = getSystemTheme();
      }
      document.documentElement.setAttribute('data-theme', effectiveTheme);
      window.dispatchEvent(new CustomEvent('campus:theme_change', { detail: effectiveTheme }));
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      // Real-time listener: when phone toggles dark mode, update instantly if on auto/system
      if (!savedTheme || savedTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        window.dispatchEvent(new CustomEvent('campus:theme_change', { detail: newTheme }));
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    let listenerHandle = null;

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', () => {
        const currentPath = window.location.pathname;
        if (currentPath === '/dashboard' || currentPath === '/') {
          CapacitorApp.minimizeApp();
        } else {
          window.history.back();
        }
      }).then(handle => {
        listenerHandle = handle;
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/listing/:id" element={<Dashboard />} />
        <Route path="/l/:id" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/stores" element={<Discover />} />
        <Route path="/saved" element={<Navigate to="/profile?tab=saved" replace />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
