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

    // 3. Listen for manual trigger from "Add to Home" button or Settings
    const handleManualTrigger = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setPlatform(isIos ? 'ios' : 'android');
      setShowPrompt(true);
    };
    window.addEventListener('campusstash:show_install_guide', handleManualTrigger);

    // 4. Auto-guide for iOS Safari users (Apple never shows an automatic install prompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let autoTimer = null;
    if (isIos) {
      const dismissed = localStorage.getItem('cs_install_prompt_dismissed');
      const isRecent = dismissed && (Date.now() - parseInt(dismissed, 10)) < 3 * 24 * 60 * 60 * 1000;
      if (!isRecent) {
        autoTimer = setTimeout(() => {
          setPlatform('ios');
          setShowPrompt(true);
        }, 2200);
      }
    }

    // 5. Detect Android / Chromium beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
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
    } else {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div 
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 12, 10, 0.55)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        animation: 'fadeInOverlay 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpCard {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>

      {/* Modal Dialog Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'var(--surface, #FFFFFF)',
          border: '1.5px solid var(--border, #EAE4DD)',
          borderRadius: '26px',
          padding: '1.4rem',
          boxShadow: '0 24px 50px -10px rgba(61, 24, 11, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          animation: 'scaleUpCard 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Bar: Icon + Title + Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <img 
              src="/apple-touch-icon.png" 
              alt="CampusStash" 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(200, 122, 91, 0.3)' 
              }} 
            />
            <div>
              <div style={{
                fontFamily: 'var(--font-display, inherit)',
                fontWeight: '800',
                fontSize: '1.05rem',
                color: 'var(--text-main, #2A2421)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Add to Home Screen
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted, #78716C)',
                marginTop: '2px'
              }}>
                Full-screen app for iPhone & iPad
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            style={{
              background: 'var(--surface-alt, #F5EFE8)',
              border: 'none',
              color: 'var(--text-muted, #78716C)',
              fontSize: '1rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Step-by-Step Visual Guide for iPhone */}
        {platform === 'ios' ? (
          <div style={{
            backgroundColor: 'var(--surface-alt, #FAF7F2)',
            border: '1px solid var(--border, #EAE4DD)',
            borderRadius: '18px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-main, #2A2421)',
            lineHeight: '1.45'
          }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#C87A5B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '800',
                flexShrink: 0
              }}>1</span>
              <span>
                Tap the Safari <strong>Share</strong> icon{' '}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  borderRadius: '7px',
                  padding: '2px 7px',
                  color: '#007AFF',
                  fontWeight: '700',
                  fontSize: '0.88rem'
                }}>
                  <i className="fa-solid fa-arrow-up-from-bracket" />
                </span>{' '}
                at the bottom of your screen.
              </span>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#C87A5B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '800',
                flexShrink: 0
              }}>2</span>
              <span>
                Scroll down and select <strong>Add to Home Screen</strong>{' '}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  borderRadius: '7px',
                  padding: '2px 7px',
                  fontSize: '0.88rem'
                }}>
                  <i className="fa-regular fa-square-plus" />
                </span>.
              </span>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#C87A5B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '800',
                flexShrink: 0
              }}>3</span>
              <span>
                Tap <strong>Add</strong> in the top-right corner.
              </span>
            </div>
          </div>
        ) : (
          /* Android 1-Click Install */
          <button
            type="button"
            onClick={handleAndroidInstall}
            style={{
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '0.95rem',
              fontFamily: 'var(--font-display, inherit)',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(200, 122, 91, 0.35)'
            }}
          >
            <i className="fa-solid fa-download" />
            <span>Install Web App</span>
          </button>
        )}

        {/* Modal Bottom Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
          {platform === 'ios' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#C87A5B', fontSize: '0.82rem', fontWeight: '700' }}>
              <i className="fa-solid fa-arrow-down" style={{ animation: 'bounceDown 1.2s infinite ease-in-out' }} />
              <span>Look at Safari bottom bar</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fast 1-tap install</span>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              backgroundColor: '#C87A5B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.55rem 1.35rem',
              fontFamily: 'var(--font-display, inherit)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(200, 122, 91, 0.25)'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
