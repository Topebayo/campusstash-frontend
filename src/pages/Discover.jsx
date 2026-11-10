import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { apiFetch, getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import SellerStorefrontModal from '../components/SellerStorefrontModal';
import ItemDetailModal from '../components/ItemDetailModal';
import ChatModal from '../components/ChatModal';

const STORE_CATEGORIES = [
  'All Stores',
  'Fashion & Thrift',
  'Phones, Gadgets & Tech',
  'Food, Snacks & Pastries',
  'Beauty, Hair & Skincare',
  'Campus Services & Beauty Skills',
  'Textbooks & Academics',
  'Hostel & Dorm Essentials',
  'Services, Printing & Repairs',
  'General Variety Store'
];

function Discover() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Stores');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [activeStorefrontSeller, setActiveStorefrontSeller] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatListing, setChatListing] = useState(null);

  // Active campus
  const activeCampusId = localStorage.getItem('campusstash_campus_id');
  const activeCampusName = localStorage.getItem('campusstash_campus_name') || 'Lead City University';

  const fetchStores = async () => {
    // Check session cache for instant render
    const cached = sessionStorage.getItem('cs_cached_stores');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStores(parsed);
          setIsLoading(false);
        }
      } catch (e) {}
    }

    try {
      let url = '/users/stores?limit=50';
      if (activeCampusId) {
        url += `&campus_id=${activeCampusId}`;
      }
      const data = await apiFetch(url);
      const list = Array.isArray(data) ? data : [];
      setStores(list);
      try {
        sessionStorage.setItem('cs_cached_stores', JSON.stringify(list));
      } catch (e) {}
    } catch (err) {
      console.warn('Failed to load campus stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [activeCampusId]);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Category filter
      if (selectedCategory !== 'All Stores') {
        const storeCat = (store.business_category || '').toLowerCase();
        const targetCat = selectedCategory.toLowerCase();
        const hasServicesMatch = selectedCategory.includes('Services') && Boolean(store.business_services);
        if (!storeCat.includes(targetCat) && !targetCat.includes(storeCat) && !hasServicesMatch) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (store.business_name || '').toLowerCase().includes(q);
        const matchDesc = (store.business_description || '').toLowerCase().includes(q);
        const matchOwner = (store.name || '').toLowerCase().includes(q);
        const matchHandle = (store.burner_handle || '').toLowerCase().includes(q);
        const matchCat = (store.business_category || '').toLowerCase().includes(q);
        const matchServices = (store.business_services || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchOwner && !matchHandle && !matchCat && !matchServices) {
          return false;
        }
      }

      return true;
    });
  }, [stores, selectedCategory, searchQuery]);

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main
        className="animate-fade-in"
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: Capacitor.isNativePlatform() ? '0.5rem 1.15rem 7rem 1.15rem' : '0.5rem 1.15rem 3rem 1.15rem',
          width: '100%',
          boxSizing: 'border-box',
          flex: 1
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: EDITORIAL TITLE & THEME TOGGLE                         */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          padding: '0 0.25rem'
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.85rem',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: '0 0 0.2rem 0'
            }}>
              Discover Stores
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Explore student businesses, thrift brands & campus shops at {activeCampusName}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggleBtn />
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEARCH BAR                                                     */}
        {/* ============================================================== */}
        <div style={{
          position: 'relative',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute',
              left: '1rem',
              color: 'var(--text-light)',
              fontSize: '0.9rem'
            }}
          />
          <input
            type="text"
            placeholder="Search stores, brands, or student vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* CATEGORY SCROLL PILLS                                          */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {STORE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid var(--terracotta)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--terracotta)' : 'var(--surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? '700' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(200, 122, 91, 0.3)' : 'var(--shadow-sm)'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* CREATE STORE BANNER (For Student Entrepreneurs)                */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: 'var(--surface-alt)',
          border: '1px dashed var(--terracotta)',
          borderRadius: '20px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <i className="fa-solid fa-store" style={{ color: 'var(--terracotta)' }} />
              Selling something on campus?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Launch your own student brand, customize your shopfront, and get discovered by campus buyers.
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--terracotta)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              whiteSpace: 'nowrap'
            }}
          >
            Manage My Store
          </button>
        </div>

        {/* ============================================================== */}
        {/* STORES GRID                                                    */}
        {/* ============================================================== */}
        {isLoading ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            border: '1px solid var(--border)'
          }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.92rem' }}>
              Discovering student shops on campus...
            </p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            border: '1px solid var(--border)'
          }}>
            <i className="fa-solid fa-store-slash" style={{ fontSize: '2.4rem', color: 'var(--terracotta)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No Stores Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto 1.25rem auto' }}>
              {searchQuery || selectedCategory !== 'All Stores'
                ? 'Try adjusting your search terms or picking another category.'
                : 'Be the first student to launch a campus store at your university!'}
            </p>
            {(searchQuery || selectedCategory !== 'All Stores') && (
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedCategory('All Stores');
                  setSearchQuery('');
                }}
                style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem', fontSize: '0.84rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredStores.map((store) => {
              const bName = store.business_name || (store.name ? `${store.name}'s Shop` : 'Campus Shop');
              const ownerName = store.name || (store.burner_handle ? `@${store.burner_handle}` : 'Student');
              const hasImages = store.sample_images && store.sample_images.length > 0;

              return (
                <div
                  key={store.id}
                  onClick={() => setActiveStorefrontSeller({ id: store.id, handle: store.burner_handle, name: bName })}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: '22px',
                    border: '1px solid var(--border)',
                    padding: '1.15rem',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  }}
                >
                  {/* Top Row: Avatar + Info + Badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Store Avatar Initial / Icon */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-alt)',
                        border: '2px solid var(--border)',
                        color: 'var(--terracotta)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        flexShrink: 0
                      }}>
                        {bName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-sans)'
                          }}>
                            {bName}
                          </h3>
                          <span style={{
                            backgroundColor: 'var(--badge-active-bg)',
                            color: 'var(--badge-active-text)',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <i className="fa-solid fa-circle-check" style={{ fontSize: '0.65rem' }} /> Verified
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          by <strong style={{ color: 'var(--text-main)' }}>{ownerName}</strong>
                          {store.business_category && (
                            <span> • <span style={{ color: 'var(--terracotta)' }}>{store.business_category}</span></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active listings pill count */}
                    <div style={{
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {store.listings_count} {store.listings_count === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  {/* Bio / Description */}
                  {store.business_description && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.4',
                      margin: '0 0 0.75rem 0',
                      opacity: 0.9,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {store.business_description}
                    </p>
                  )}

                  {/* Rendered Campus Services Badges */}
                  {store.business_services && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {store.business_services.split(',').map(s => s.trim()).filter(Boolean).map((srv, idx) => (
                        <span key={idx} style={{
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)'
                        }}>
                          ✨ {srv}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pickup Location if provided */}
                  {store.business_address && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--terracotta)' }} />
                      <span>{store.business_address}</span>
                    </div>
                  )}

                  {/* Sample Product Images Thumbnail Row */}
                  {hasImages && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.5rem',
                      marginBottom: '0.85rem'
                    }}>
                      {store.sample_images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            height: '84px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={getImageUrl(imgUrl)}
                            alt=""
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStorefrontSeller({ id: store.id, handle: store.burner_handle, name: bName });
                      }}
                      className="btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.8rem',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <i className="fa-solid fa-shop" /> Visit Store
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {store.business_whatsapp && (
                        <a
                          href={`https://wa.me/${store.business_whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#25D366',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            fontSize: '0.9rem'
                          }}
                          title="WhatsApp Vendor"
                        >
                          <i className="fa-brands fa-whatsapp" />
                        </a>
                      )}
                      {store.business_instagram && (
                        <a
                          href={`https://instagram.com/${store.business_instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--surface-alt)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            textDecoration: 'none',
                            fontSize: '0.85rem'
                          }}
                          title="Instagram"
                        >
                          <i className="fa-brands fa-instagram" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Seller Storefront Modal */}
      {activeStorefrontSeller && (
        <SellerStorefrontModal
          isOpen={Boolean(activeStorefrontSeller)}
          sellerId={activeStorefrontSeller.id}
          sellerHandle={activeStorefrontSeller.handle}
          initialSellerName={activeStorefrontSeller.name}
          onClose={() => setActiveStorefrontSeller(null)}
          onSelectItem={(item) => setSelectedListing(item)}
          onMessageSeller={(storeInfo) => {
            setChatListing({
              id: storeInfo?.id,
              seller_id: storeInfo?.id,
              title: storeInfo?.business_name || storeInfo?.name || 'Store Chat',
              is_shop_chat: true,
              seller: storeInfo
            });
          }}
        />
      )}

      {/* Item Detail Modal */}
      {selectedListing && (
        <ItemDetailModal
          isOpen={Boolean(selectedListing)}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onOpenChat={(item) => setChatListing(item)}
        />
      )}

      {/* Chat Modal */}
      {chatListing && (
        <ChatModal
          isOpen={Boolean(chatListing)}
          listing={chatListing}
          onClose={() => setChatListing(null)}
        />
      )}
    </div>
  );
}

export default Discover;

