import React from 'react';
import { getImageUrl } from '../api';

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
  onSelectListing
}) {
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  React.useEffect(() => {
    setActiveImageIdx(0);
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

  const priceFormatted = (listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });

  // Auto-suggest related/similar active items
  const suggestedItems = (allListings || [])
    .filter(item => item && item.id !== listing.id && item.status !== 'sold')
    .sort((a, b) => {
      if (a.category === listing.category && b.category !== listing.category) return -1;
      if (b.category === listing.category && a.category !== listing.category) return 1;
      return 0;
    })
    .slice(0, 4);

    const [copyFeedback, setCopyFeedback] = React.useState(false);

  const getShareUrl = () => {
    const origin = window.location.origin;
    return `${origin}/?item=${listing.id}`;
  };

  const handleWhatsAppShare = (e) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareUrl();
    const campusTag = listing.campus_acronym || (listing.campus_name ? listing.campus_name : 'Campus');
    const msg = `📦 Selling on CampusStash: ${listing.title} for ₦${priceFormatted} at ${campusTag}! View details & negotiate safely here: ${shareUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyLinkAndImage = async (e) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareUrl();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);

    if (listing.image_url) {
      try {
        const link = document.createElement('a');
        link.href = getImageUrl(listing.image_url);
        link.download = `campusstash-${listing.id}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {}
    }
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

  const handleShareClick = (e) => {
    handleWhatsAppShare(e);
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
            height: '225px',
            flexShrink: 0,
            backgroundColor: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {currentDisplayImage ? (
              <img 
                key={currentDisplayImage}
                src={getImageUrl(currentDisplayImage)} 
                alt={listing.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease-in-out' }} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.detail-img-placeholder');
                  if (fb) fb.style.display = 'block';
                }}
              />
            ) : null}
            <div className="detail-img-placeholder" style={{ color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-display)', display: currentDisplayImage ? 'none' : 'block' }}>
              <i className="fa-regular fa-image" style={{ fontSize: '2.2rem', marginBottom: '0.4rem', display: 'block', opacity: 0.4 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>No image provided</span>
            </div>

            {/* If multiple images: Previous / Next Chevron Buttons */}
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
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Previous photo"
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
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Next photo"
                >
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem' }} />
                </button>

                {/* Photo Count Pill Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '0.85rem',
                  right: '0.85rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.22rem 0.55rem',
                  borderRadius: '10px',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  zIndex: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <i className="fa-regular fa-image" /> {activeImageIdx + 1} / {allImages.length}
                </div>
              </>
            )}

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

          {/* Thumbnail Selector Strip (if 2+ images) */}
          {allImages.length > 1 && (
            <div style={{
              display: 'flex',
              gap: '0.65rem',
              padding: '0.65rem 1.25rem',
              backgroundColor: 'var(--surface-alt)',
              borderBottom: '1px solid var(--border)'
            }}>
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activeImageIdx === idx ? '2px solid var(--brandgreen)' : '1px solid var(--border)',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: activeImageIdx === idx ? 1 : 0.6,
                    transform: activeImageIdx === idx ? 'scale(1.05)' : 'none',
                    transition: 'all 0.15s ease-in-out',
                    backgroundColor: 'var(--surface)'
                  }}
                  title="View photo"
                >
                  <img 
                    src={getImageUrl(imgUrl)} 
                    alt="Thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </button>
              ))}
            </div>
          )}

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

            {/* Safe Campus Handshake Card */}
            <div style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              lineHeight: '1.45'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>???</span>
              <div style={{ fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--brandgreen)', display: 'block', marginBottom: '0.2rem' }}>
                  Safe Campus Handshake
                </strong>
                Always meet at a designated public spot (e.g. Library Gate, Student Union Building). Inspect the item physically before paying via cash or direct bank transfer.
              </div>
            </div>

            {/* Viral WhatsApp Share Card */}
            <div style={{
              backgroundColor: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.35)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#128C7E', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-display)' }}>
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.1rem' }} /> Share on WhatsApp
                </span>
                {copyFeedback && (
                  <span style={{ fontSize: '0.75rem', color: '#128C7E', fontWeight: '700' }}>
                    Link Copied! ??
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                Post directly to your WhatsApp Status or hostel groups to find student buyers quickly.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    flex: 1,
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <i className="fa-brands fa-whatsapp" /> Share to WhatsApp Status
                </button>
                <button
                  type="button"
                  onClick={handleCopyLinkAndImage}
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title="Copy Link"
                >
                  <i className="fa-solid fa-copy" /> Copy Link & Image
                </button>
              </div>
            </div>

            {/* Auto-Suggested Related Items */}
            {suggestedItems.length > 0 && (
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--brandblue)' }} />
                    Suggested for You
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {suggestedItems[0].category === listing.category ? `More in ${listing.category}` : 'Campus Deals'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                  gap: '0.6rem'
                }}>
                  {suggestedItems.map(item => {
                    const itemPrice = (item.price_kobo ? (item.price_kobo / 100) : (item.price || 0)).toLocaleString();
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectListing && onSelectListing(item)}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface-alt)',
                          padding: '0.45rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '70px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--surface)',
                          overflow: 'hidden'
                        }}>
                          {item.image_url ? (
                            <img 
                              src={getImageUrl(item.image_url)} 
                              alt={item.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <i className="fa-regular fa-image" style={{ fontSize: '1.2rem', opacity: 0.4 }} />
                            </div>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: 'var(--font-display)'
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          color: 'var(--brandblue)',
                          fontFamily: 'var(--font-display)'
                        }}>
                          ₦{itemPrice}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
