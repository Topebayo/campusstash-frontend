import React, { useState, useEffect } from 'react';
import { getImageUrl, CLOUD_HOST } from '../api';

function ItemDetailModal({ 
  isOpen = true, 
  onClose, 
  listing, 
  onMessageSeller, 
  onRequireAuth, 
  currentUserId,
  onEditListing,
  onToggleStatus,
  onDeleteListing,
  allListings = [],
  onSelectListing,
  zIndex = 1100
}) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setActiveImageIdx(0);
    if (listing?.id) {
      try {
        const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
        setIsBookmarked(saved.includes(listing.id));
      } catch (e) {
        setIsBookmarked(false);
      }
    }
  }, [listing?.id]);

  if (!listing) return null;

  const allImages = (() => {
    const list = [];
    if (listing.image_url) list.push(listing.image_url);
    if (Array.isArray(listing.images)) {
      listing.images.forEach(img => {
        const u = typeof img === 'string' ? img : img?.image_url;
        if (u && !list.includes(u)) list.push(u);
      });
    }
    return list;
  })();

  const currentDisplayImage = allImages[activeImageIdx] || listing.image_url;

  const isMyListing = currentUserId && (
    String(listing.seller_id).toLowerCase() === String(currentUserId).toLowerCase() || 
    listing.is_mine
  );
  const isSold = listing.status === 'sold';

  const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
  const priceFormatted = rawPrice.toLocaleString(undefined, { maximumFractionDigits: (rawPrice % 1 === 0 ? 0 : 2) });

  const sellerDisplayName = listing.seller_handle 
    ? listing.seller_handle.split('@').pop() 
    : 'Student Seller';

  const campusName = listing.campus_name || listing.campus_acronym || 'Lead City University (LCU)';

  const toggleBookmark = (e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
      const updated = saved.includes(listing.id)
        ? saved.filter(id => id !== listing.id)
        : [...saved, listing.id];
      localStorage.setItem('saved_listings', JSON.stringify(updated));
      setIsBookmarked(updated.includes(listing.id));
    } catch (e) {}
  };

  const getShareUrl = () => {
    const base = CLOUD_HOST || window.location.origin;
    return `${base}/l/${listing.id}`;
  };

  const handleShareClick = async (e) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareUrl();
    const msg = `📦 Selling on CampusStash: ${listing.title} for ₦${priceFormatted} at ${campusName}! Check it out here: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `CampusStash: ${listing.title}`,
          text: msg,
          url: shareUrl
        });
        return;
      } catch (err) {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleMessageClick = (e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        window.location.href = '/auth';
      }
      return;
    }
    onClose();
    if (onMessageSeller) {
      onMessageSeller(listing);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex }}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '480px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0, 
          overflow: 'hidden', 
          borderRadius: '28px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative'
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: BACK, MARKETPLACE, SHARE & HEART                       */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem 0.75rem 1.25rem',
          backgroundColor: 'var(--surface)',
          zIndex: 10
        }}>
          {/* Back Button */}
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Go Back"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          {/* Centered Title */}
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.05rem',
            fontWeight: '600',
            color: 'var(--text-main)'
          }}>
            Marketplace
          </span>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              onClick={handleShareClick}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
              title="Share Listing"
            >
              <i className="fa-solid fa-arrow-up-from-bracket" />
              {copyFeedback && (
                <span style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#1C1917',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap'
                }}>
                  Copied!
                </span>
              )}
            </button>

            <button
              onClick={toggleBookmark}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isBookmarked ? '#E0533C' : 'var(--text-main)',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)'
              }}
              title={isBookmarked ? "Remove Bookmark" : "Save Item"}
            >
              <i className={isBookmarked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 1.25rem 1.25rem' }}>
          
          {/* ============================================================== */}
          {/* HERO IMAGE CONTAINER WITH PAGINATION DOTS                      */}
          {/* ============================================================== */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            borderRadius: '22px',
            overflow: 'hidden',
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            {currentDisplayImage ? (
              <img 
                src={getImageUrl(currentDisplayImage)} 
                alt={listing.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.detail-fallback');
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="detail-fallback"
              style={{ 
                width: '100%', 
                height: '100%', 
                display: currentDisplayImage ? 'none' : 'flex',
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-light)',
                fontSize: '2.5rem'
              }}
            >
              <i className="fa-regular fa-image" />
            </div>

            {/* Left/Right chevron overlay if multiple images */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                  }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--text-main)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.75rem' }} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--text-main)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.75rem' }} />
                </button>
              </>
            )}
          </div>

          {/* Image Pagination Dots */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.1rem' }}>
              {allImages.map((_, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: activeImageIdx === idx ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: activeImageIdx === idx ? '#1C1917' : '#D6CEC5',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* PRICE & TITLE                                                  */}
          {/* ============================================================== */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              ₦{priceFormatted}
            </div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginTop: '0.25rem',
              lineHeight: 1.3
            }}>
              {listing.title}
            </h1>
          </div>

          {/* ============================================================== */}
          {/* PASTEL TAGS: CONDITION & CATEGORY                              */}
          {/* ============================================================== */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {/* Condition Pill */}
            <span style={{
              backgroundColor: '#E8F3EB',
              color: '#2E7D32',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: '600'
            }}>
              {listing.condition || (isSold ? 'Sold' : 'Like New')}
            </span>

            {/* Category Pill */}
            {listing.category && (
              <span style={{
                backgroundColor: '#FAF1EC',
                color: 'var(--terracotta)',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: '600'
              }}>
                {listing.category}
              </span>
            )}

            {/* Campus Tag */}
            <span style={{
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-muted)',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: '600'
            }}>
              🎓 {listing.campus_acronym || 'Campus'}
            </span>
          </div>

          {/* ============================================================== */}
          {/* VERIFIED SELLER CARD                                           */}
          {/* ============================================================== */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            marginBottom: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Seller Avatar */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              border: '2px solid var(--border)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--terracotta)',
              fontWeight: '700',
              fontSize: '1.1rem',
              flexShrink: 0
            }}>
              {listing.seller_avatar ? (
                <img 
                  src={getImageUrl(listing.seller_avatar)} 
                  alt={sellerDisplayName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                sellerDisplayName.charAt(0).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.94rem' }}>
                  {sellerDisplayName}
                </span>
                <span style={{ color: 'var(--terracotta)', fontSize: '0.78rem', fontWeight: '600' }}>
                  (verified)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>★ 4.9 (12 reviews)</span>
                <span>•</span>
                <span>{campusName}</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* DESCRIPTION CARD                                               */}
          {/* ============================================================== */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '1rem',
            marginBottom: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <p style={{
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              margin: 0,
              whiteSpace: 'pre-line'
            }}>
              {listing.description || 'Hardly used, in great condition. Works flawlessly. DM me to meet up on campus.'}
            </p>
          </div>

          {/* ============================================================== */}
          {/* CAMPUS PICKUP DROPZONE CARD                                    */}
          {/* ============================================================== */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '18px',
            border: '1px solid var(--border)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📍</span>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                Pickup Location
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {listing.pickup_location || `${listing.campus_acronym || 'LCU'} Campus - Main Cafeteria`}
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* BOTTOM FIXED ACTION BAR: HEART + TERRACOTTA MESSAGE BUTTON     */}
        {/* ============================================================== */}
        <div style={{
          padding: '0.85rem 1.25rem 1.25rem 1.25rem',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 10
        }}>
          {isMyListing ? (
            <>
              {onEditListing && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onEditListing(listing)}
                  style={{ flex: 1, borderRadius: '9999px', padding: '0.8rem', fontWeight: '700' }}
                >
                  <i className="fa-solid fa-pen-to-square" /> Edit Listing
                </button>
              )}
              {onToggleStatus && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onToggleStatus(listing.id, listing.status)}
                  style={{
                    flex: 1,
                    borderRadius: '9999px',
                    padding: '0.8rem',
                    backgroundColor: isSold ? '#2E7D32' : 'var(--terracotta)',
                    fontWeight: '700'
                  }}
                >
                  {isSold ? 'Mark as Active' : 'Mark as Sold'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleBookmark}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isBookmarked ? '#E0533C' : 'var(--text-muted)',
                  fontSize: '1.15rem',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0
                }}
                title={isBookmarked ? "Remove Bookmark" : "Save Item"}
              >
                <i className={isBookmarked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleMessageClick}
                disabled={isSold}
                style={{
                  flex: 1,
                  borderRadius: '9999px',
                  padding: '0.85rem 1.5rem',
                  backgroundColor: isSold ? '#94A3B8' : 'var(--terracotta)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '700',
                  boxShadow: isSold ? 'none' : '0 4px 16px rgba(200, 122, 91, 0.35)',
                  cursor: isSold ? 'not-allowed' : 'pointer'
                }}
              >
                {isSold ? 'Item Already Sold' : `Message ${sellerDisplayName}`}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default ItemDetailModal;
