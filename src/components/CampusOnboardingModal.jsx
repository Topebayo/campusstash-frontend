import React, { useState, useMemo } from 'react';
import { findNearestCampus } from '../api';

function CampusOnboardingModal({ 
  isOpen, 
  campuses = [], 
  onSelectCampus,
  currentCampusId = ''
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [detectedResult, setDetectedResult] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS geolocation is not supported by your device or browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    setDetectedResult(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const result = findNearestCampus(latitude, longitude, campuses);
        if (result && result.campus) {
          setDetectedResult(result);
        } else {
          setLocationError('Unable to match your location to a nearby campus. Please pick your school below.');
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) { // PERMISSION_DENIED
          setLocationError('Location permission denied. Please choose your campus manually below.');
        } else {
          setLocationError('Could not retrieve GPS coordinates. Please select your school manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const filteredCampuses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return campuses;
    return campuses.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.acronym?.toLowerCase().includes(q) ||
      c.state?.toLowerCase().includes(q)
    );
  }, [campuses, searchQuery]);

  return (
    <div 
      className="modal-overlay" 
      style={{
        zIndex: 2000,
        backgroundColor: 'rgba(28, 25, 23, 0.78)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface)',
          borderRadius: '28px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.75rem 1.5rem 1.25rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-alt)'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: 'var(--terracotta)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.65rem',
            margin: '0 auto 0.85rem auto',
            boxShadow: '0 8px 20px rgba(200, 122, 91, 0.3)'
          }}>
            🎓
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--text-main)',
            margin: '0 0 0.4rem 0',
            letterSpacing: '-0.02em'
          }}>
            Select Your Campus
          </h2>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            CampusStash connects you with students directly on your campus for safe handoffs. Choose your school to view the local marketplace feed.
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* GPS Detection Button */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handleAutoDetectGPS}
              disabled={isLocating}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '16px',
                border: '1.5px dashed var(--terracotta)',
                backgroundColor: 'rgba(200, 122, 91, 0.08)',
                color: 'var(--terracotta)',
                fontWeight: '700',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                cursor: isLocating ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
            >
              {isLocating ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  <span>Locating nearby Nigerian campus...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-location-crosshairs" style={{ fontSize: '1.05rem' }} />
                  <span>Auto-Detect My Campus (GPS)</span>
                </>
              )}
            </button>

            {/* GPS Error Message */}
            {locationError && (
              <div style={{
                marginTop: '0.65rem',
                padding: '0.6rem 0.85rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#B91C1C',
                fontSize: '0.82rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}>
                <i className="fa-solid fa-triangle-exclamation" />
                <span>{locationError}</span>
              </div>
            )}

            {/* GPS Detected Success Card */}
            {detectedResult && (
              <div style={{
                marginTop: '0.85rem',
                padding: '1rem',
                borderRadius: '18px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: '#16A34A', fontSize: '1.1rem' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {detectedResult.campus.name} ({detectedResult.campus.acronym})
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: '600' }}>
                      📍 Nearest campus ({detectedResult.distanceKm} km away in {detectedResult.campus.state})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onSelectCampus(detectedResult.campus.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#16A34A',
                    borderColor: '#16A34A'
                  }}
                >
                  <span>Confirm & Enter {detectedResult.campus.acronym}</span>
                  <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            margin: '1.25rem 0',
            color: 'var(--text-light)',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
            <span>or select manually</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <i 
              className="fa-solid fa-magnifying-glass" 
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
                fontSize: '0.88rem'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school name, acronym, city (e.g. Lead City, UI, Poly, Unilag, Ibadan)..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.6rem',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Campus Cards List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            maxHeight: '260px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {filteredCampuses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.88rem'
              }}>
                <i className="fa-regular fa-building" style={{ fontSize: '1.75rem', opacity: 0.5, display: 'block', marginBottom: '0.5rem' }} />
                <span>No campus found matching &quot;{searchQuery}&quot;.</span>
              </div>
            ) : (
              filteredCampuses.map((c) => {
                const isSelected = currentCampusId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCampus(c.id)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'rgba(200, 122, 91, 0.08)' : 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          fontWeight: '700',
                          fontSize: '0.92rem',
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {c.name}
                        </span>
                        <span style={{
                          backgroundColor: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          borderRadius: '9999px',
                          padding: '1px 7px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: 'var(--terracotta)'
                        }}>
                          {c.acronym}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📍 {c.state} • Local Campus Marketplace
                      </div>
                    </div>

                    <i 
                      className="fa-solid fa-chevron-right" 
                      style={{ 
                        color: isSelected ? 'var(--terracotta)' : 'var(--text-light)', 
                        fontSize: '0.8rem' 
                      }} 
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: 'var(--surface-alt)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <span>💡 You can switch campuses anytime from the top bar.</span>
          <button
            type="button"
            onClick={() => onSelectCampus('')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--terracotta)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.78rem'
            }}
          >
            Browse All Nigerian Campuses
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampusOnboardingModal;

