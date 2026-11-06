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
            padding: '3rem 1.5rem 2rem 1.5rem',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Grid: 4 Columns on Desktop */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '2.5rem',
              marginBottom: '2.5rem'
            }}
          >
            {/* Column 1: Brand & Mission */}
            <div style={{ maxWidth: '320px' }}>
              <div 
                onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.55rem', 
                  cursor: 'pointer',
                  marginBottom: '0.85rem'
                }}
              >
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: '700'
                }}>
                  🎓
                </div>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em'
                }}>
                  CampusStash
                </span>
              </div>

              <p style={{
                fontSize: '0.88rem',
                lineHeight: 1.55,
                color: 'var(--text-muted)',
                margin: '0 0 1rem 0'
              }}>
                The aesthetic peer-to-peer marketplace & campus store hub for Nigerian universities. Buy, sell, and connect safely across campus.
              </p>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#15803D'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span>Active across Nigerian Campuses</span>
              </div>
            </div>

            {/* Column 2: Marketplace Categories */}
            <div>
              <h4 style={{
                fontSize: '0.92rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Marketplace
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <li>
                  <button 
                    onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    📚 Textbooks & Academics
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    📱 Tech, Gadgets & Laptops
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    👕 Campus Fits & Thrift
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    🛋️ Hostel & Dorm Essentials
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/dashboard'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    📢 Daily Student Requests
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Student Stores & Businesses */}
            <div>
              <h4 style={{
                fontSize: '0.92rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Student Stores
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                <li>
                  <button 
                    onClick={() => { navigate('/profile'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    🏬 Launch a Campus Store
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/profile'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    📦 Bulk Inventory Drops
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => { navigate('/messages'); scrollToTop(); }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    💬 Direct In-App Chat
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowSafetyModal(true)}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                  >
                    🛡️ Verified Seller Badges
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Trust, Safety & Campuses */}
            <div>
              <h4 style={{
                fontSize: '0.92rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Campus Safety
              </h4>
              <p style={{ fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                Trades happen directly on campus. Always meet in public student areas like student union buildings, library halls, or main gates.
              </p>
              <button
                type="button"
                onClick={() => setShowSafetyModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--terracotta)' }} />
                <span>Read Campus Safety Guide</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Quick Links */}
          <div 
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.82rem'
            }}
          >
            <div>
              &copy; {new Date().getFullYear()} CampusStash. Built by Nigerian students, for students.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span 
                onClick={() => setShowSafetyModal(true)} 
                style={{ cursor: 'pointer' }}
              >
                Safety Guidelines
              </span>
              <span>•</span>
              <span 
                onClick={() => { navigate('/dashboard'); scrollToTop(); }} 
                style={{ cursor: 'pointer' }}
              >
                Lead City • UI • Poly Ibadan • Unilag • OAU
              </span>
              <span>•</span>
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
              padding: '1.75rem'
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
