import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

function Footer() {
  const navigate = useNavigate();
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // NEVER render on Android / iOS native mobile app
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer 
        className="web-only-footer"
        style={{
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          marginTop: 'auto',
          marginBottom: 0,
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div 
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '2.5rem 1.5rem 0.75rem 1.5rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Row: Brand identity on left, clean interactive pills on right */}
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem',
              paddingBottom: '1.75rem',
              borderBottom: '1px solid var(--border)'
            }}
          >
            {/* Brand identity */}
            <div 
              onClick={() => { navigate('/dashboard'); scrollToTop(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                backgroundColor: 'var(--terracotta)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem'
              }}>
                🎓
              </div>
              <div>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  display: 'block',
                  lineHeight: 1.15
                }}>
                  CampusStash
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'block',
                  marginTop: '0.2rem'
                }}>
                  Peer-to-peer campus marketplace & student stores across Nigerian Universities
                </span>
              </div>
            </div>

            {/* Clean Pill Links with spacious layout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.65rem'
            }}>
              <button
                type="button"
                onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                className="footer-nav-pill"
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '0.45rem 0.95rem',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Browse Items
              </button>

              <button
                type="button"
                onClick={() => { navigate('/profile'); scrollToTop(); }}
                className="footer-nav-pill"
                style={{
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '0.45rem 0.95rem',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🏬 Campus Stores
              </button>

              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                className="footer-nav-pill"
                style={{
                  background: 'rgba(200, 122, 91, 0.1)',
                  border: '1px solid rgba(200, 122, 91, 0.25)',
                  borderRadius: '9999px',
                  padding: '0.45rem 0.95rem',
                  color: 'var(--terracotta)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="fa-solid fa-shield-halved" />
                <span>Safety Guidelines</span>
              </button>
            </div>
          </div>

          {/* Sub Row: Copyright and Back to top */}
          <div 
            style={{
              paddingTop: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              &copy; {new Date().getFullYear()} CampusStash • Built for Nigerian Universities 🇳🇬
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--terracotta)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0,
                fontSize: '0.82rem'
              }}
              title="Scroll back to top"
            >
              <span>Back to Top</span>
              <i className="fa-solid fa-arrow-up" style={{ fontSize: '0.72rem' }} />
            </button>
          </div>
        </div>
      </footer>

      {/* Campus Safety Guide Modal */}
      {showSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowSafetyModal(false)} style={{ zIndex: 1300 }}>
          <div 
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '1.75rem',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(200, 122, 91, 0.15)',
                  color: 'var(--terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-shield-halved" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Campus Safety Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'block', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                  📍 1. Meet in Populated Campus Spots
                </strong>
                Always conduct exchanges during daylight in open public areas like your Student Union Building (SUB), department faculties, library halls, or main school gates. Avoid secluded off-campus locations.
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'block', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                  🔍 2. Inspect Before Paying
                </strong>
                Thoroughly test electronic gadgets, turn on phones or calculators, and check textbook editions and conditions before finalizing any payment.
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'block', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                  💬 3. Keep Chats on CampusStash
                </strong>
                Communicate using the built-in campus messaging. Keeping discussions on the platform creates an accountable record and protects both buyers and student vendors.
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', backgroundColor: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'block', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                  🚫 4. Never Send Advance Deposits
                </strong>
                Never pay upfront booking fees or delivery charges to an unknown person before seeing the product in person.
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowSafetyModal(false)}
              style={{
                width: '100%',
                borderRadius: '9999px',
                padding: '0.75rem',
                marginTop: '1.5rem',
                fontWeight: '700'
              }}
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
