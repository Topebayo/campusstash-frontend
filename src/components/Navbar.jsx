import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import SettingsModal from './SettingsModal';

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
  } catch (e) {}
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

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';
  const isProfile = location.pathname === '/profile';
  const isMessages = location.pathname === '/messages';
  const isDiscover = location.pathname === '/discover' || location.pathname === '/stores';

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
        let total = 0;
        try {
          const res = await apiFetch('/conversations/unread-count');
          total = res?.total_unread || 0;
        } catch (e) {
          const convs = await apiFetch('/conversations').catch(() => []);
          if (Array.isArray(convs)) {
            total = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          }
        }

        if (isMounted) {
          setUnreadCount(prev => {
            if (total > prev && prev > 0) {
              triggerNotification(
                'CampusStash: New Message',
                `You have ${total} unread message(s)`
              );
            }
            return total;
          });
        }
      } catch (err) {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 15000);

    const handleMessagesRead = () => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
      }
      checkUnread();
    };
    window.addEventListener('campus:messages_read', handleMessagesRead);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('campus:messages_read', handleMessagesRead);
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

  return (
    <>
      {/* Aesthetic Minimal Floating Bottom Navigation Dock (All Devices) */}
      <nav className="aesthetic-bottom-dock">
        {/* 1. Home */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`aesthetic-dock-btn ${isHome ? 'active' : ''}`}
          title="Marketplace Home"
        >
          <i className="fa-solid fa-house" />
          {isHome && <span className="aesthetic-dock-dot" />}
        </button>

        {/* 2. Messages */}
        <button
          onClick={() => {
            if (!token) {
              navigate('/auth');
            } else {
              navigate('/messages');
            }
          }}
          className={`aesthetic-dock-btn ${isMessages ? 'active' : ''}`}
          title="Campus Messages"
        >
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={isMessages ? "fa-solid fa-comment" : "fa-regular fa-comment"} />
            {unreadCount > 0 && (
              <span className="dock-badge-pill" style={{ top: '-8px', right: '-12px' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {isMessages && <span className="aesthetic-dock-dot" />}
        </button>

        {/* 3. Center Elevated Action Button (+) */}
        <button 
          className="aesthetic-dock-center-plus"
          onClick={() => {
            if (!token) {
              navigate('/auth');
            } else if (onPrimaryAction) {
              onPrimaryAction();
            } else {
              navigate('/dashboard', { state: { openCreateModal: true } });
            }
          }}
          title="Sell an Item"
        >
          <i className="fa-solid fa-plus" />
        </button>

        {/* 4. Discover Campus Stores & Student Brands */}
        <button
          onClick={() => navigate('/discover')}
          className={`aesthetic-dock-btn ${isDiscover ? 'active' : ''}`}
          title="Discover Stores"
        >
          <i className="fa-solid fa-store" />
          {isDiscover && <span className="aesthetic-dock-dot" />}
        </button>

        {/* 5. My Profile Page */}
        <button
          onClick={() => {
            if (!token) {
              navigate('/auth');
            } else {
              navigate('/profile');
            }
          }}
          className={`aesthetic-dock-btn ${isProfile ? 'active' : ''}`}
          title="My Profile"
        >
          <i className={isProfile ? "fa-solid fa-user" : "fa-regular fa-user"} />
          {isProfile && <span className="aesthetic-dock-dot" />}
        </button>
      </nav>

      {/* Global Settings & Security Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onLogout={handleLogout} 
      />
    </>
  );
}

export default Navbar;
