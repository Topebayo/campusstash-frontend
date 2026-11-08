import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState('ios'); // 'ios' | 'android'
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. If running as native Capacitor app, don't show PWA install prompt
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // 2. Check if already installed in standalone mode (home screen)
    const isStandalone = 
      window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      return;
    }

    // 3. Check if user dismissed recently (snooze for 5 days)
    const dismissedTime = localStorage.getItem('cs_install_prompt_dismissed');
    if (dismissedTime) {
      const diffDays = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 5) {
        return;
      }
    }

    // 4. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;

    if (isIosDevice) {
      // Delay prompt by 2.5s so user can view page first
      const timer = setTimeout(() => {
        setPlatform('ios');
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 5. Detect Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      // Delay slightly
      setTimeout(() => setShowPrompt(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also listen for manual trigger from Settings / Profile
    const handleManualTrigger = () => {
      setShowPrompt(true);
    };
    window.addEventListener('campusstash:show_install_guide', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('campusstash:show_install_guide', handleManualTrigger);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('cs_install_prompt_dismissed', Date.now().toString());
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '430px',
      backgroundColor: 'var(--surface, #FFFFFF)',
      border: '1.5px solid var(--border, #EAE4DD)',
      borderRadius: '24px',
      padding: '1.25rem 1.25rem 1.15rem 1.25rem',
      boxShadow: '0 20px 45px -10px rgba(61, 24, 11, 0.22), 0 0 1px 1px rgba(0,0,0,0.05)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
      animation: 'slideUpPrompt 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      backdropFilter: 'blur(16px)',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes slideUpPrompt {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes pulseArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
      `}</style>

      {/* Top Header: Logo + Title + Close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/apple-touch-icon.png" 
            alt="CampusStash Icon" 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '11px',
              boxShadow: '0 4px 12px rgba(200, 122, 91, 0.25)' 
            }} 
          />
          <div>
            <div style={{
              fontFamily: 'var(--font-display, inherit)',
              fontWeight: '800',
              fontSize: '1rem',
              color: 'var(--text-main, #2A2421)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Install CampusStash
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted, #78716C)',
              marginTop: '2px'
            }}>
              Add to Home Screen for the full app experience
            </div>
          </div>
        </div>

        <button 
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #78716C)',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Step by Step Guide for iPhone */}
      {platform === 'ios' ? (
        <div style={{
          backgroundColor: 'var(--surface-alt, #FAF7F2)',
          border: '1px solid var(--border, #EAE4DD)',
          borderRadius: '16px',
          padding: '0.85rem 0.95rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          fontSize: '0.82rem',
          color: 'var(--text-main, #2A2421)',
          lineHeight: '1.4'
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: '700',
              flexShrink: 0
            }}>1</span>
            <span>
              Tap the Safari <strong>Share</strong> button{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.06)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.82rem',
                color: '#007AFF',
                fontWeight: '600'
              }}>
                <i className="fa-solid fa-arrow-up-from-bracket" />
              </span>{' '}
              in the bottom toolbar.
            </span>
          </div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: '700',
              flexShrink: 0
            }}>2</span>
            <span>
              Scroll down and tap <strong>Add to Home Screen</strong>{' '}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.06)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.82rem'
              }}>
                <i className="fa-regular fa-square-plus" />
              </span>
            </span>
          </div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: '700',
              flexShrink: 0
            }}>3</span>
            <span>
              Tap <strong>Add</strong> in the top-right corner. Done!
            </span>
          </div>
        </div>
      ) : (
        /* Android 1-Click Install */
        <button
          onClick={handleAndroidInstall}
          style={{
            backgroundColor: '#C87A5B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '14px',
            padding: '0.85rem',
            fontFamily: 'var(--font-display, inherit)',
            fontWeight: '700',
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(200, 122, 91, 0.35)'
          }}
        >
          <i className="fa-solid fa-download" />
          <span>Add to Home Screen</span>
        </button>
      )}

      {/* Action Footer for iOS */}
      {platform === 'ios' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#C87A5B', fontSize: '0.78rem', fontWeight: '600' }}>
            <i className="fa-solid fa-arrow-down" style={{ animation: 'pulseArrow 1.2s infinite ease-in-out' }} />
            <span>Look at bottom of screen</span>
          </div>

          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.45rem 1.15rem',
              fontFamily: 'var(--font-display, inherit)',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
