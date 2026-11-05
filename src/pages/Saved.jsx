import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import ItemDetailModal from '../components/ItemDetailModal';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import ChatModal from '../components/ChatModal';

function Saved() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [savedListings, setSavedListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);
  const [chatListing, setChatListing] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
    }
  }, [token, navigate]);

  const fetchSavedListings = async () => {
    setIsLoading(true);
    try {
      const savedIds = JSON.parse(localStorage.getItem('saved_listings') || '[]');
      if (savedIds.length === 0) {
        setSavedListings([]);
        setIsLoading(false);
        return;
      }

      const data = await apiFetch('/listings/');
      const allItems = data.items || (Array.isArray(data) ? data : []);
      const matched = allItems.filter(item => savedIds.includes(item.id));
      setSavedListings(matched);
    } catch (err) {
      console.warn("Failed to fetch saved listings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSavedListings();
    }
  }, [token]);

  const handleRemoveBookmark = (e, listingId) => {
    e.stopPropagation();
    const savedIds = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    const updated = savedIds.filter(id => id !== listingId);
    localStorage.setItem('saved_listings', JSON.stringify(updated));
    setSavedListings(prev => prev.filter(item => item.id !== listingId));
  };

  if (!token) return null;

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main 
        className="animate-fade-in"
        style={{ 
          maxWidth: '520px', 
          margin: '0 auto', 
          padding: '0.5rem 1.15rem 7rem 1.15rem', 
          width: '100%', 
          boxSizing: 'border-box', 
          flex: 1 
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: EDITORIAL TITLE & COUNT                                */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
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
              Saved Items
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {savedListings.length} {savedListings.length === 1 ? 'item' : 'items'} bookmarked on campus
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggleBtn />
            {savedListings.length > 0 && (
              <button
                onClick={fetchSavedListings}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--terracotta)',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Content */}
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
              Loading your saved items...
            </p>
          </div>
        ) : savedListings.length === 0 ? (
          <div style={{
            padding: '3.5rem 1.5rem',
            borderRadius: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              color: 'var(--terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              margin: '0 auto 1rem auto'
            }}>
              <i className="fa-regular fa-bookmark" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No Saved Items Yet
            </h3>
            <p style={{ maxWidth: '320px', margin: '0 auto 1.35rem auto', fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
              Tap the heart icon on any textbook, gadget, or dorm essential to bookmark it here for quick access.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
              style={{ borderRadius: '9999px', padding: '0.65rem 1.4rem' }}
            >
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="aesthetic-grid-2col">
            {savedListings.map(listing => {
              const isSold = listing.status === 'sold';
              const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
              const priceFormatted = rawPrice.toLocaleString(undefined, { maximumFractionDigits: (rawPrice % 1 === 0 ? 0 : 2) });
              const sellerName = listing.seller_handle ? listing.seller_handle.split('@').pop() : 'Seller';

              return (
                <article 
                  key={listing.id}
                  className="aesthetic-card"
                  onClick={() => setSelectedDetailListing(listing)}
                >
                  {/* Image Box */}
                  <div className="aesthetic-card-image-box">
                    {listing.image_url ? (
                      <img 
                        src={getImageUrl(listing.image_url)} 
                        alt={listing.title} 
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.listing-fallback');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="listing-fallback" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: listing.image_url ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-light)',
                        fontSize: '1.75rem'
                      }}
                    >
                      <i className="fa-regular fa-image" />
                    </div>

                    {/* Top-Left Pill */}
                    <div className="aesthetic-card-seller-pill">
                      <span>by {sellerName}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ color: isSold ? '#ef4444' : '#2E7D32' }}>
                        {isSold ? 'Sold' : 'Active'}
                      </span>
                    </div>

                    {/* Top-Right Heart Button (Active/Saved) */}
                    <button
                      type="button"
                      className="aesthetic-card-heart-btn active"
                      onClick={(e) => handleRemoveBookmark(e, listing.id)}
                      title="Remove Bookmark"
                    >
                      <i className="fa-solid fa-heart" />
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="aesthetic-card-details">
                    <h3 className="aesthetic-card-title">
                      {listing.title}
                    </h3>
                    <div className="aesthetic-card-price">
                      ₦{priceFormatted}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedDetailListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedDetailListing}
          onClose={() => setSelectedDetailListing(null)}
          onMessageSeller={(item) => {
            setSelectedDetailListing(null);
            setChatListing(item);
          }}
          allListings={savedListings}
        />
      )}

      {/* Direct Chat Modal */}
      {chatListing && (
        <ChatModal 
          isOpen={true} 
          listing={chatListing} 
          onClose={() => setChatListing(null)} 
        />
      )}
    </div>
  );
}

export default Saved;

