import React from 'react';
import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      backgroundColor: 'var(--surface)',
      marginTop: 'auto',
      padding: '2.5rem 1.5rem 2rem 1.5rem',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      transition: 'background-color 0.25s ease, border-color 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Top Row: Brand & Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          {/* Brand info */}
          <div style={{ maxWidth: '360px' }}>
            <div 
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                marginBottom: '0.75rem'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--brandblue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.95rem'
              }}>
                <i className="fa-solid fa-graduation-cap" />
              </div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                letterSpacing: '-0.02em'
              }}>
                Campus<span style={{ color: 'var(--brandblue)' }}>Stash</span>
              </span>
            </div>
            <p style={{
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              The peer-to-peer campus marketplace. Trade textbooks, tech, appliances, and gear securely with fellow students.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div style={{
            display: 'flex',
            gap: '3rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <h4 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-main)',
                marginBottom: '0.75rem'
              }}>
                Marketplace
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brandblue)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Browse Gear
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/profile')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brandblue)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    My Listings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/messages')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brandblue)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Inbox & Chats
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.85rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-main)',
                marginBottom: '0.75rem'
              }}>
                Safety & Trust
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--brandblue)', fontSize: '0.8rem' }} /> Campus Dropzones
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-user-shield" style={{ color: 'var(--brandblue)', fontSize: '0.8rem' }} /> Verified Students
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-lock" style={{ color: 'var(--brandblue)', fontSize: '0.8rem' }} /> Secure Direct Handoffs
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright & Status */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem'
        }}>
          <div>
            &copy; 2026 CampusStash. Built for students.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981'
            }} />
            <span>Campus Network Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
