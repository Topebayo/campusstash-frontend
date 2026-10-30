import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Theme Sync: 'system', 'light', or 'dark'
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (savedTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', savedTheme);
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
  );
}

export default App;
