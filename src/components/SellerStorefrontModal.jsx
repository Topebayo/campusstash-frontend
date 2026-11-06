import React, { useState, useEffect } from 'react';
import { apiFetch, getImageUrl } from '../api';

function SellerStorefrontModal({ 
  isOpen = true, 
  sellerId, 
  sellerHandle,
  initialSellerName = 'Student Vendor',
  onClose,
  onSelectItem,
  onMessageSeller
}) {
  const [storeData, setStoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const identifier = sellerId || sellerHandle;
    if (!identifier) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    apiFetch(`/listings/store/${encodeURIComponent(identifier)}`)
      .then((data) => {
        setStoreData(data);
      })
      .catch((err) => {
        console.warn('Failed to load storefront:', err);
        setError('Could not load student shop catalog');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, sellerId, sellerHandle]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sellerName = storeData?.seller?.name || storeData?.seller?.burner_handle?.replace(/^@/, '') || initialSellerName || 'Student';
  const campusDisplay = storeData?.campus_name || storeData?.campus_acronym || 'Lead City University';
  const items = storeData?.items || [];

  const isStore = storeData?.seller?.account_type === 'store';
  const storeTitle = isStore && storeData?.seller?.business_name 
    ? storeData.seller.business_name 
    : (storeData?.seller?.name ? `${storeData.seller.name}'s Campus Shop` : `${sellerName}'s Campus Shop`);

  const ownerDisplayName = storeData?.seller?.name || sellerName;
  const storeCategory = storeData?.seller?.business_category;
  const storeBio = storeData?.seller?.business_description;
  const pickupLocation = storeData?.seller?.business_address;
  const whatsappNum = storeData?.seller?.business_whatsapp || storeData?.seller?.phone;
  const instagramHandle = storeData?.seller?.business_instagram;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative'
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR                                                        */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}
            title="Close Storefront"
          >
            <i className="fa-solid fa-xmark" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
            <span>{isStore ? '🏬' : '🎓'}</span>
            <span>{isStore ? 'Campus Storefront' : 'Student Closet'}</span>
          </div>

          <div style={{ width: '36px' }} />
        </div>

        {/* ============================================================== */}
        {/* SCROLLABLE STOREFRONT BODY                                     */}
        {/* ============================================================== */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '1.25rem 1.25rem 2rem 1.25rem'
        }}>
          {/* Vendor Brand Banner & Header Card */}
          <div style={{
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
              {/* Vendor Avatar */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--terracotta-light)',
                color: 'var(--terracotta)',
                border: '2px solid var(--terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isStore ? '1.5rem' : '1.4rem',
                fontWeight: '800',
                flexShrink: 0
              }}>
                {isStore ? '🏬' : sellerName.charAt(0).toUpperCase()}
              </div>

              {/* Vendor Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {isStore ? storeTitle : `@${sellerName}'s Closet`}
                  </h2>
                  <span style={{
                    backgroundColor: isStore ? 'var(--badge-active-bg)' : 'var(--primary-light)',
                    color: isStore ? 'var(--badge-active-text)' : 'var(--terracotta)',
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    borderRadius: '9999px',
                    padding: '2px 8px'
                  }}>
                    {isStore ? 'Verified Campus Store' : 'Student Peer'}
                  </span>
                  {isStore && storeCategory && (
                    <span style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      borderRadius: '9999px',
                      padding: '2px 8px'
                    }}>
                      {storeCategory}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {isStore && (
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      Owned by {ownerDisplayName} • 
                    </span>
                  )}
                  <span> 📍 {pickupLocation ? `${pickupLocation} (${campusDisplay})` : campusDisplay}</span>
                  <span style={{ margin: '0 5px' }}>•</span>
                  <span>{items.length} item{items.length === 1 ? '' : 's'} in stock</span>
                </div>
              </div>
            </div>

            {/* Store Bio / Tagline */}
            {storeBio && (
              <div style={{
                fontSize: '0.84rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--border)',
                lineHeight: 1.45
              }}>
                &ldquo;{storeBio}&rdquo;
              </div>
            )}

            {/* Vendor Action Bar */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              {onMessageSeller && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const vendorId = storeData?.seller?.id || sellerId;
                    const vendorHandle = storeData?.seller?.burner_handle || sellerHandle;
                    onClose();
                    onMessageSeller({ 
                      seller_id: vendorId, 
                      recipient_id: vendorId, 
                      seller_name: isStore ? storeTitle : sellerName,
                      seller_handle: vendorHandle,
                      is_shop_chat: true,
                      title: isStore ? storeTitle : `${sellerName}'s Closet`
                    });
                  }}
                  style={{
                    flex: 1,
                    minWidth: '130px',
                    borderRadius: '9999px',
                    padding: '0.65rem 1rem',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <i className="fa-regular fa-comment" />
                  <span>{isStore ? 'Chat with Store' : 'Message Seller'}</span>
                </button>
              )}

              {whatsappNum && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const cleanPhone = String(whatsappNum).replace(/[^0-9]/g, '');
                    const formatted = cleanPhone.startsWith('0') ? `234${cleanPhone.slice(1)}` : cleanPhone;
                    const msg = encodeURIComponent(`Hi ${ownerDisplayName}! I saw ${storeTitle} on CampusStash and wanted to ask about your items.`);
                    window.open(`https://wa.me/${formatted}?text=${msg}`, '_blank');
                  }}
                  style={{
                    borderRadius: '9999px',
                    padding: '0.65rem 1rem',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    color: '#22c55e',
                    borderColor: 'rgba(34, 197, 94, 0.3)'
                  }}
                  title="Chat on WhatsApp"
                >
                  <i className="fa-brands fa-whatsapp" />
                  <span>WhatsApp</span>
                </button>
              )}

              {instagramHandle && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const cleanIg = instagramHandle.replace(/^@/, '');
                    window.open(`https://instagram.com/${cleanIg}`, '_blank');
                  }}
                  style={{
                    borderRadius: '9999px',
                    padding: '0.65rem 1rem',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    color: '#E1306C',
                    borderColor: 'rgba(225, 48, 108, 0.3)'
                  }}
                  title="Visit Instagram"
                >
                  <i className="fa-brands fa-instagram" />
                  <span>Instagram</span>
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/dashboard?vendor=${encodeURIComponent(sellerHandle || sellerId || '')}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).catch(() => {});
                  }
                  alert('Storefront link copied to clipboard!');
                }}
                style={{
                  borderRadius: '9999px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                title="Share Shop Link"
              >
                <i className="fa-solid fa-share-nodes" />
                <span>Share Shop</span>
              </button>
            </div>
          </div>

          {/* Catalog Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Shop Catalog ({items.length})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Bundle deals available on campus
            </span>
          </div>

          {/* Loading / Error States */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.8rem', color: 'var(--terracotta)', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading store catalog...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.9rem' }}>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
              <h4 style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.3rem' }}>No Active Items</h4>
              <p style={{ fontSize: '0.85rem' }}>This vendor currently has no items in stock.</p>
            </div>
          ) : (
            /* Items Grid */
            <div className="aesthetic-grid-2col" style={{ gap: '0.85rem' }}>
              {items.map((item) => {
                const rawPrice = item.price_kobo ? (item.price_kobo / 100) : (item.price || 0);
                const priceFormatted = rawPrice.toLocaleString(undefined, { maximumFractionDigits: (rawPrice % 1 === 0 ? 0 : 2) });
                return (
                  <article
                    key={item.id}
                    className="aesthetic-card"
                    onClick={() => {
                      if (onSelectItem) {
                        onSelectItem(item);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="aesthetic-card-image-box" style={{ height: '140px' }}>
                      {item.image_url ? (
                        <img 
                          src={getImageUrl(item.image_url)} 
                          alt={item.title} 
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '1.5rem' }}>
                          <i className="fa-regular fa-image" />
                        </div>
                      )}
                      <div className="aesthetic-card-status-pill active" style={{ bottom: '8px', left: '8px' }}>
                        <span className="aesthetic-status-dot active" />
                        <span>In Stock</span>
                      </div>
                    </div>

                    <div className="aesthetic-card-details" style={{ padding: '0.65rem 0.85rem' }}>
                      <h4 className="aesthetic-card-title" style={{ fontSize: '0.86rem', WebkitLineClamp: 1 }}>
                        {item.title}
                      </h4>
                      <div className="aesthetic-card-price" style={{ fontSize: '0.98rem', marginTop: '2px' }}>
                        ₦{priceFormatted}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellerStorefrontModal;

