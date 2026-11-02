import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';

function App() {
  const navigate = useNavigate();

  // On desktop: default to Device Frame view (Option A mobile mockup)
  // User can toggle between device frame and expanded view
  const [deviceMode, setDeviceMode] = useState(() => {
    const saved = localStorage.getItem('cs_view_mode');
    return saved ? saved : 'device'; // 'device' | 'expanded'
  });

  const toggleDeviceMode = () => {
    setDeviceMode(prev => {
      const next = prev === 'device' ? 'expanded' : 'device';
      localStorage.setItem('cs_view_mode', next);
      return next;
    });
  };

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
    <div className={`app-shell ${deviceMode === 'device' ? 'device-mode-active' : 'expanded-mode-active'}`}>
      
      {/* Desktop View Mode Switcher Pill (Visible only on PC / Tablet) */}
      <aside className="device-toggle-bar">
        <button 
          onClick={toggleDeviceMode}
          className="device-toggle-btn"
          title="Switch view mode on PC"
        >
          {deviceMode === 'device' ? (
            <>
              <i className="fa-solid fa-expand" />
              <span>Expand to Full Screen</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-mobile-screen-button" />
              <span>Fit to Mobile Device</span>
            </>
          )}
        </button>
      </aside>

      {/* Main Device Shell */}
      <div className="device-frame">
        {/* Subtle Dynamic Island Bezel Header (shown on PC device mode) */}
        <div className="device-dynamic-island" />

        <div className="device-viewport-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/listing/:id" element={<Dashboard />} />
            <Route path="/l/:id" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </div>

    </div>
  );
}

export default App;
