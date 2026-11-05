import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Saved from './pages/Saved';

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
          backgroundColor: '#FBF8F3',
          color: '#1C1917',
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
              } catch(e) {}
              window.location.reload();
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
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') {
        applyTheme();
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
        <Route path="/saved" element={<Saved />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
