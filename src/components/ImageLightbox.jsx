import React, { useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '../api';

function ImageLightbox({
  isOpen,
  images = [],
  initialIndex = 0,
  onClose,
  title = 'Listing Photo'
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setZoomLevel(1);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setZoomLevel(1);
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleToggleZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomLevel(prev => (prev === 1 ? 2 : prev === 2 ? 2.8 : 1));
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null || zoomLevel > 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="lightbox-overlay animate-fade-in"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 8, 8, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}
    >
      {/* Lightbox Header Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          color: '#FFFFFF',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            padding: '4px 12px',
            borderRadius: '9999px',
            letterSpacing: '0.02em',
            fontFamily: 'var(--font-sans)'
          }}>
            {currentIndex + 1} / {images.length}
          </span>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '320px',
            opacity: 0.9,
            fontFamily: 'var(--font-sans)'
          }}>
            {title}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Zoom Toggle Button */}
          <button
            onClick={handleToggleZoom}
            title={zoomLevel > 1 ? "Reset Zoom" : "Zoom In (2x)"}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: zoomLevel > 1 ? 'var(--terracotta)' : 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.15s ease'
            }}
          >
            <i className={zoomLevel > 1 ? "fa-solid fa-magnifying-glass-minus" : "fa-solid fa-magnifying-glass-plus"} />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close Lightbox (Esc)"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      {/* Main Stage Image */}
      <div 
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '1rem'
        }}
      >
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            title="Previous Photo (Left Arrow)"
            style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.15rem',
              zIndex: 20,
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              transition: 'transform 0.15s ease'
            }}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}

        {/* The Photo Frame */}
        <div 
          onClick={handleToggleZoom}
          style={{
            maxWidth: '92vw',
            maxHeight: '78vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `scale(${zoomLevel})`
          }}
        >
          <img
            src={getImageUrl(currentImage)}
            alt={title}
            style={{
              maxWidth: '90vw',
              maxHeight: '76vh',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              pointerEvents: 'auto'
            }}
            draggable={false}
          />
        </div>

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            title="Next Photo (Right Arrow)"
            style={{
              position: 'absolute',
              right: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(30, 30, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.15rem',
              zIndex: 20,
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              transition: 'transform 0.15s ease'
            }}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '1rem',
            overflowX: 'auto',
            zIndex: 10
          }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setZoomLevel(1);
                setCurrentIndex(idx);
              }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: currentIndex === idx ? '2px solid var(--terracotta)' : '1px solid rgba(255, 255, 255, 0.25)',
                opacity: currentIndex === idx ? 1 : 0.55,
                transform: currentIndex === idx ? 'scale(1.08)' : 'scale(1)',
                padding: 0,
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <img
                src={getImageUrl(img)}
                alt={`Thumbnail ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageLightbox;
