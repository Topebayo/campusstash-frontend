import React from 'react';
import { getImageUrl } from '../api';

function ItemDetailModal({ 
  isOpen = true, 
  onClose, 
  listing, 
  onMessageSeller, 
  currentUserId,
  onEditListing,
  onToggleStatus,
  onDeleteListing 
}) {
  if (!listing) return null;

  const isMyListing = currentUserId && (
    String(listing.seller_id).toLowerCase() === String(currentUserId).toLowerCase() || 
    listing.is_mine
  );
  const isSold = listing.status === 'sold';

  const priceFormatted = (listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handleMessageClick = (e) => {
    if (e) e.stopPropagation();
    onClose();
    if (onMessageSeller) {
      onMessageSeller(listing);
    }
  };

  const handleShareClick = (e) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out ${listing.title} on CampusStash for ₦${priceFormatted}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Listing link copied to clipboard!');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0, 
          overflow: 'hidden', 
          borderRadius: '24px',
          backgroundColor: 'var(--modal-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Scrollable Content Wrapper */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Image Preview Header */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '210px',
            flexShrink: 0,
            backgroundColor: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {listing.image_url ? (
              <img 
                src={getImageUrl(listing.image_url)} 
                alt={listing.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.detail-img-placeholder');
                  if (fb) fb.style.display = 'block';
                }}
              />
            ) : null}
            <div className="detail-img-placeholder" style={{ color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-display)', display: listing.image_url ? 'none' : 'block' }}>
              <i className="fa-regular fa-image" style={{ fontSize: '2.2rem', marginBottom: '0.4rem', display: 'block', opacity: 0.4 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>No image provided</span>
            </div>

            {/* Gradient shadow for header badges */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '70px',
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            {/* Top Right Action Buttons (Share & Close) */}
            <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', display: 'flex', gap: '0.45rem', zIndex: 10 }}>
              <button 
                onClick={handleShareClick}
                title="Share listing"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <i className="fa-solid fa-share-nodes" />
              </button>
              <button 
                onClick={onClose}
                title="Close modal"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Status & Category Badges */}
            <div style={{ position: 'absolute', bottom: '0.85rem', left: '1rem', display: 'flex', gap: '0.45rem', alignItems: 'center', zIndex: 5 }}>
              {listing.category && (
                <div style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--brandblue)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {listing.category}
                </div>
              )}
              {isSold && (
                <div style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  Item Sold
                </div>
              )}
            </div>
          </div>

          {/* Body Information Section */}
          <div style={{ padding: '1.25rem 1.25rem 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Title & Price Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  lineHeight: '1.25',
                  marginBottom: '0.35rem',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em'
                }}>
                  {listing.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Seller:</span>
                  <span style={{ 
                    color: 'var(--brandblue)', 
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    backgroundColor: 'var(--lightblue)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px'
                  }}>
                    @{listing.seller_handle || 'anonymous'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--brandblue)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <i className="fa-solid fa-circle-check" /> Verified Student
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: 'var(--brandblue)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1
                }}>
                  ₦{priceFormatted}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: '500' }}>
                  Student Asking Price
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.9rem' }}>
              <h4 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.78rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem'
              }}>
                Item Condition & Details
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                {listing.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Campus Safety Tip */}
            <div style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--brandblue)', fontSize: '1.15rem', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                <strong style={{ color: 'var(--text-main)' }}>Campus Safety:</strong> Meet in public campus areas (cafeteria, library dropzones) for handovers.
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer - Always 100% Visible & Clickable */}
        <div style={{
          padding: '0.85rem 1.25rem 1.15rem 1.25rem',
          backgroundColor: 'var(--modal-bg)',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          boxShadow: '0 -4px 15px rgba(0,0,0,0.03)'
        }}>
          {isMyListing ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem', backgroundColor: isSold ? 'var(--brandblue)' : '#ef4444' }}
                onClick={() => onToggleStatus && onToggleStatus(listing)}
              >
                <i className={isSold ? "fa-solid fa-rotate-right" : "fa-solid fa-circle-check"} />
                {isSold ? 'Re-activate' : 'Mark Sold'}
              </button>
              <button 
                className="btn-secondary"
                style={{ padding: '0.75rem 1rem', fontSize: '0.88rem' }}
                onClick={() => onEditListing && onEditListing(listing)}
              >
                <i className="fa-solid fa-pen" /> Edit
              </button>
              <button 
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
                onClick={() => onDeleteListing && onDeleteListing(listing)}
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ) : isSold ? (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--text-muted)',
              borderRadius: '12px',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: '0.4rem', color: '#ef4444' }} />
              This item has been marked as sold
            </div>
          ) : (
            <button 
              className="btn-primary" 
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-blue)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onClick={handleMessageClick}
            >
              <i className="fa-regular fa-comment-dots" style={{ fontSize: '1.1rem' }} />
              Message Seller Anonymously
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;
