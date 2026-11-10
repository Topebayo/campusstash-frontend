import React, { useState, useEffect } from 'react';
import { getImageUrl, CLOUD_HOST, apiFetch } from '../api';
import ImageLightbox from './ImageLightbox';

function ItemDetailModal({ 
  isOpen = true, 
  onClose, 
  listing, 
  onMessageSeller, 
  onOpenStorefront,
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [enrichedListing, setEnrichedListing] = useState(listing);

  useEffect(() => {
    setEnrichedListing(listing);
    if (listing?.id && (!listing.seller_handle && !listing.seller)) {
      apiFetch(`/listings/${listing.id}`)
        .then(full => {
          if (full && full.id) {
            setEnrichedListing(prev => ({ ...prev, ...full }));
          }
        })
        .catch(() => {});
    }
  }, [listing?.id]);

  const activeListing = enrichedListing || listing;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLightboxOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLightboxOpen]);

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

  const sellerDisplayName = activeListing.seller_handle 
    ? activeListing.seller_handle.split('@').pop() 
    : (activeListing.seller?.burner_handle 
        ? activeListing.seller.burner_handle.split('@').pop() 
        : (activeListing.seller?.name || activeListing.seller_name || (activeListing.seller_id ? `Student (${String(activeListing.seller_id).slice(-4)})` : 'Student Seller')));

  const sellerAvatar = activeListing.seller_avatar || activeListing.seller?.avatar_slug || activeListing.seller?.avatar;

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
      onClose();
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        window.location.href = '/auth';
      }
      return;
    }
    onClose();
    if (onMessageSeller) {
      onMessageSeller(activeListing || listing);
    }
  };

  // Common Action Buttons for both Desktop & Mobile Action Bars
  const renderActionButtons = (isDesktop = false) => {
    if (isMyListing) {
      return (
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          {onEditListing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onEditListing(listing)}
              style={{ flex: 1, borderRadius: '9999px', padding: isDesktop ? '0.85rem' : '0.8rem', fontWeight: '700' }}
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
                padding: isDesktop ? '0.85rem' : '0.8rem',
                backgroundColor: isSold ? '#2E7D32' : 'var(--terracotta)',
                fontWeight: '700'
              }}
            >
              {isSold ? 'Mark as Active' : 'Mark as Sold'}
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <button
          type="button"
          onClick={toggleBookmark}
          style={{
            width: isDesktop ? '50px' : '48px',
            height: isDesktop ? '50px' : '48px',
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
            flexShrink: 0,
            transition: 'all 0.2s ease'
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
            padding: isDesktop ? '0.9rem 1.6rem' : '0.85rem 1.5rem',
            backgroundColor: isSold ? '#94A3B8' : 'var(--terracotta)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '700',
            boxShadow: isSold ? 'none' : '0 4px 16px rgba(200, 122, 91, 0.35)',
            cursor: isSold ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isSold ? 'Item Already Sold' : `Message ${sellerDisplayName}`}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex }}>
        <div 
          className="modal-content animate-fade-in item-detail-dialog" 
          onClick={(e) => e.stopPropagation()} 
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

          {/* ============================================================== */}
          {/* RESPONSIVE BODY: GALLERY & PRODUCT DETAILS                      */}
          {/* ============================================================== */}
          <div 
            className="item-detail-body" 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '0 1.25rem 1.25rem 1.25rem',
              boxSizing: 'border-box'
            }}
          >
            {/* ----------------- LEFT / GALLERY COLUMN ----------------- */}
            <div className="item-detail-gallery-col" style={{ width: '100%', marginBottom: '1rem' }}>
              {/* HERO IMAGE CONTAINER */}
              <div 
                className="item-detail-hero-box"
                onClick={() => setIsLightboxOpen(true)}
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '22px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}
                title="Tap or click to expand full photo"
              >
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

                {/* Tap to expand Pill */}
                <div className="item-expand-pill">
                  <i className="fa-solid fa-expand" />
                  <span>Fullscreen</span>
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
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-pill-alpha)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 6
                      }}
                      title="Previous Image"
                    >
                      <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.8rem' }} />
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
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-pill-alpha)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 6
                      }}
                      title="Next Image"
                    >
                      <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem' }} />
                    </button>
                  </>
                )}
              </div>

              {/* Photo Thumbnails Filmstrip / Dots */}
              {allImages.length > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  overflowX: 'auto',
                  padding: '2px 0'
                }}>
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: activeImageIdx === idx ? '2px solid var(--terracotta)' : '1px solid var(--border)',
                        padding: 0,
                        backgroundColor: 'var(--surface-alt)',
                        cursor: 'pointer',
                        opacity: activeImageIdx === idx ? 1 : 0.65,
                        transform: activeImageIdx === idx ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.18s ease',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Photo thumbnail ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ----------------- RIGHT / INFO COLUMN ----------------- */}
            <div className="item-detail-info-col" style={{ width: '100%' }}>
              {/* PRICE & TITLE */}
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

              {/* PASTEL TAGS: CONDITION & CATEGORY */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {/* Condition Pill - only display if explicitly set by seller */}
                {activeListing.condition && (
                  <span style={{
                    backgroundColor: 'var(--badge-active-bg)',
                    color: 'var(--badge-active-text)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '600'
                  }}>
                    {activeListing.condition}
                  </span>
                )}

                {/* Status Pill for Sold items */}
                {isSold && (
                  <span style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '700'
                  }}>
                    Sold
                  </span>
                )}

                {/* Category Pill */}
                {activeListing.category && (
                  <span style={{
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--terracotta)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '600'
                  }}>
                    {activeListing.category}
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

              {/* VERIFIED SELLER CARD */}
              <div style={{
                backgroundColor: 'var(--surface-alt)',
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
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-pill)',
                  border: '2px solid var(--border)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--terracotta)',
                  fontWeight: '700',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  {sellerAvatar ? (
                    <img 
                      src={getImageUrl(sellerAvatar)} 
                      alt={sellerDisplayName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    sellerDisplayName.charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.98rem' }}>
                      {activeListing.seller?.account_type === 'store' && activeListing.seller?.business_name
                        ? activeListing.seller.business_name
                        : sellerDisplayName}
                    </span>
                    <span style={{ 
                      backgroundColor: activeListing.seller?.account_type === 'store' ? 'var(--badge-active-bg)' : 'var(--primary-light)', 
                      color: activeListing.seller?.account_type === 'store' ? 'var(--badge-active-text)' : 'var(--terracotta)', 
                      fontSize: '0.74rem', 
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="fa-solid fa-circle-check" style={{ fontSize: '0.7rem' }} /> {activeListing.seller?.account_type === 'store' ? 'Campus Store' : 'Verified'}
                    </span>
                  </div>
                  {activeListing.seller?.account_type === 'store' && activeListing.seller?.name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Owned by {activeListing.seller.name}
                    </div>
                  )}
                  {activeListing.seller?.account_type === 'store' && activeListing.seller?.business_services && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '4px' }}>
                      {activeListing.seller.business_services.split(',').map(s => s.trim()).filter(Boolean).map((srv, idx) => (
                        <span key={idx} style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)'
                        }}>
                          ✨ {srv}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    <span style={{ color: '#F59E0B', fontWeight: '700' }}>
                      ★ {activeListing.seller?.rating ? activeListing.seller.rating.toFixed(1) : '0.0'}
                    </span>
                    <span>({activeListing.seller?.reviews_count || 0} reviews)</span>
                    <span>•</span>
                    <span>{campusName}</span>
                  </div>

                  {onOpenStorefront && (
                    <button
                      type="button"
                      onClick={() => onOpenStorefront({
                        seller_id: activeListing.seller_id,
                        seller_handle: activeListing.seller_handle || activeListing.seller?.burner_handle,
                        seller_name: activeListing.seller?.business_name || sellerDisplayName
                      })}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: 'var(--terracotta)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginTop: '6px'
                      }}
                    >
                      <span>{activeListing.seller?.account_type === 'store' ? '🏪 Browse Campus Storefront' : '📦 View Seller Catalog'}</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.65rem' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* DESCRIPTION CARD */}
              <div style={{
                backgroundColor: 'var(--surface-alt)',
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
                  {activeListing.description || 'Hardly used, in great condition. Works flawlessly. DM me to meet up on campus.'}
                </p>
              </div>

              {/* CAMPUS PICKUP DROPZONE CARD */}
              <div style={{
                backgroundColor: 'var(--surface-alt)',
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

              {/* DESKTOP INTEGRATED ACTION BUTTONS */}
              <div className="item-detail-desktop-actions">
                {renderActionButtons(true)}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* MOBILE FIXED BOTTOM ACTION BAR                                 */}
          {/* ============================================================== */}
          <div 
            className="item-detail-mobile-bottom-bar"
            style={{
              padding: '0.85rem 1.25rem 1.25rem 1.25rem',
              backgroundColor: 'var(--surface)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              zIndex: 10
            }}
          >
            {renderActionButtons(false)}
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* EXPANDABLE FULLSCREEN IMAGE LIGHTBOX VIEWER                    */}
      {/* ============================================================== */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={allImages}
        initialIndex={activeImageIdx}
        onClose={() => setIsLightboxOpen(false)}
        title={listing.title}
      />
    </>
  );
}

export default ItemDetailModal;
