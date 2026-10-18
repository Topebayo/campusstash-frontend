import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getImageUrl } from '../api';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ItemDetailModal from '../components/ItemDetailModal';
import ChatModal from '../components/ChatModal';
import CreateListingModal from '../components/CreateListingModal';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const CATEGORIES = [
  { name: 'All', icon: 'fa-solid fa-border-all' },
  { name: 'Textbooks', icon: 'fa-solid fa-book-open' },
  { name: 'Electronics', icon: 'fa-solid fa-laptop' },
  { name: 'Dorm Essentials', icon: 'fa-solid fa-bed' },
  { name: 'Fashion & Apparel', icon: 'fa-solid fa-shirt' },
  { name: 'Other', icon: 'fa-solid fa-box-archive' }
];

const PRICE_RANGES = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under ₦5,000', min: 0, max: 5000 },
  { label: '₦5,000 - ₦20,000', min: 5000, max: 20000 },
  { label: 'Over ₦20,000', min: 20000, max: null }
];

function Dashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState(() => {
    try {
      const cached = localStorage.getItem('cs_cached_listings');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('cs_cached_listings');
      return !cached || JSON.parse(cached).length === 0;
    } catch (e) {
      return true;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatListing, setChatListing] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Bookmarked item IDs saved in localStorage
  const [savedItemIds, setSavedItemIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_listings') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.sub) {
        setCurrentUserId(decoded.sub);
      }
    }
  }, []);

  const toggleBookmark = (e, listingId) => {
    e.stopPropagation();
    setSavedItemIds(prev => {
      const updated = prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem('saved_listings', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      let query = '/listings/';
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
        params.append('q', searchQuery.trim());
      }

      if (sortOption) {
        params.append('sort', sortOption);
      }

      const activeRange = PRICE_RANGES[priceRangeIndex];
      if (activeRange.min !== null) {
        params.append('min_price', activeRange.min);
      }
      if (activeRange.max !== null) {
        params.append('max_price', activeRange.max);
      }

      const queryString = params.toString();
      if (queryString) {
        query += `?${queryString}`;
      }

      const data = await apiFetch(query);
      let itemsList = [];
      if (Array.isArray(data)) {
        itemsList = data;
      } else if (data && Array.isArray(data.items)) {
        itemsList = data.items;
      }
      setListings(itemsList);
      if (selectedCategory === 'All' && !searchQuery.trim() && itemsList.length > 0) {
        try {
          localStorage.setItem('cs_cached_listings', JSON.stringify(itemsList));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
      // Don't wipe listings on error — keep showing cached data so images stay visible
      // while the Render backend cold-starts. Only fall back to empty if nothing cached.
      setListings(prev => {
        if (prev.length > 0) return prev;
        try {
          const cached = localStorage.getItem('cs_cached_listings');
          return cached ? JSON.parse(cached) : [];
        } catch (e) {
          return [];
        }
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption, priceRangeIndex]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Re-fetch when user returns to the tab after being away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchListings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Also handle Android app resume from background
    let capListener = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) fetchListings();
      }).then(listener => { capListener = listener; });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (capListener) capListener.remove();
    };
  }, [fetchListings]);

  // Instant client-side search & filtering fallback for instantaneous UI response
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // Category filter
      if (selectedCategory !== 'All' && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      // Price range filter
      const activeRange = PRICE_RANGES[priceRangeIndex];
      const itemPriceNaira = item.price_kobo ? (item.price_kobo / 100) : (item.price || 0);
      if (activeRange.min !== null && itemPriceNaira < activeRange.min) return false;
      if (activeRange.max !== null && itemPriceNaira > activeRange.max) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.price_kobo ? (a.price_kobo / 100) : (a.price || 0);
      const priceB = b.price_kobo ? (b.price_kobo / 100) : (b.price || 0);
      if (sortOption === 'price_asc') return priceA - priceB;
      if (sortOption === 'price_desc') return priceB - priceA;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [listings, selectedCategory, searchQuery, priceRangeIndex, sortOption]);

  const handleOpenCreateModal = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleOpenChat = (listing, e = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }
    setChatListing(listing);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        onPrimaryAction={handleOpenCreateModal}
        primaryActionText="Sell an Item"
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.25rem 2.5rem 1.25rem', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        {/* Glassmorphic Hero & Search Header */}
        <div 
          className="animate-fade-in"
          style={{
            position: 'relative',
            borderRadius: '28px',
            padding: '2.5rem 2rem',
            marginBottom: '2rem',
            background: 'var(--hero-bg)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glowing Aura */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '820px', position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: '800',
              letterSpacing: '-0.035em',
              color: 'var(--text-main)',
              lineHeight: '1.18'
            }}>
              Campus <span className="text-brandblue">Marketplace</span>
            </h1>



            {/* Interactive Live Search Input */}
            <div style={{ position: 'relative', width: '100%', marginTop: '1.35rem' }}>
              <i 
                className="fa-solid fa-magnifying-glass" 
                style={{
                  position: 'absolute',
                  left: '1.15rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--brandblue)',
                  fontSize: '1.1rem',
                  pointerEvents: 'none'
                }}
              />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, scientific calculators, laptops, dorm fans, chargers..."
                style={{
                  width: '100%',
                  padding: '0.95rem 2.6rem 0.95rem 2.9rem',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.98rem',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '0.2rem'
                  }}
                  title="Clear search"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{
          display: 'flex',
          gap: '0.65rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'none'
        }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--brandblue)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--lightblue)' : 'var(--surface)',
                  color: isSelected ? 'var(--brandblue)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? 'var(--shadow-blue)' : 'none'
                }}
              >
                <i className={cat.icon} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Sort Toolbar */}
        <div className="filter-sort-card">
          {/* Price Range Pills */}
          <div className="price-filter-track">
            {PRICE_RANGES.map((range, index) => {
              const active = priceRangeIndex === index;
              return (
                <button
                  key={range.label}
                  onClick={() => setPriceRangeIndex(index)}
                  className={`price-pill-btn ${active ? 'active' : ''}`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="sort-controls-group">
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: '600' }}>
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select-input"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            <button 
              className="sort-refresh-btn"
              onClick={fetchListings}
              title="Refresh listings"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
          </div>
        </div>

        {/* Listings Grid Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              letterSpacing: '-0.02em'
            }}>
              {selectedCategory === 'All' ? 'Recent Campus Gear' : selectedCategory}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredListings.length} verified item{filteredListings.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Listings Grid */}
                {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                style={{
                  height: '330px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--surface-alt)',
                  animation: 'pulse 1.5s infinite'
                }} 
              />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            border: '2px dashed var(--border)',
            marginTop: '1rem'
          }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--brandblue)', opacity: 0.5, marginBottom: '1rem', display: 'block' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              No Gear Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              We couldn't find any items matching your search or filters. Try clearing your search term or post a new listing!
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setPriceRangeIndex(0); }}>
                Clear Filters
              </button>
              <button className="btn-primary" onClick={handleOpenCreateModal}>
                <i className="fa-solid fa-plus" />
                Post Item Now
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredListings.map(listing => {
              const isSold = listing.status === 'sold';
              const priceFormatted = (listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });
              const isMine = currentUserId && listing.seller_id === currentUserId;
              const isBookmarked = savedItemIds.includes(listing.id);

              return (
                <div 
                  key={listing.id}
                  className="listing-card"
                  onClick={() => setSelectedListing(listing)}
                  style={{
                    cursor: 'pointer',
                    opacity: isSold ? 0.78 : 1,
                    position: 'relative',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    backgroundColor: 'var(--card-bg)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Thumbnail Container */}
                  <div style={{ position: 'relative', width: '100%', height: '190px', backgroundColor: 'var(--surface-alt)', overflow: 'hidden' }}>
                    {listing.image_url ? (
                      <img 
                        src={getImageUrl(listing.image_url)} 
                        alt={listing.title} 
                        loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.parentElement?.querySelector('.listing-placeholder');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="listing-placeholder" style={{ width: '100%', height: '100%', borderRadius: 0, margin: 0, display: listing.image_url ? 'none' : 'flex' }}>
                      <i className="fa-regular fa-image" style={{ fontSize: '2rem', opacity: 0.35 }} />
                    </div>
                    
                    {/* Category & Status Badges */}
                    <div style={{
                      position: 'absolute',
                      top: '0.65rem',
                      left: '0.65rem',
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        padding: '0.28rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        backgroundColor: isSold ? '#4b5563' : 'var(--surface)',
                        color: isSold ? '#ffffff' : 'var(--brandblue)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(8px)'
                      }}>
                        {isSold ? 'Sold' : (listing.category || 'Gear')}
                      </div>
                    </div>

                    {/* Bookmark Heart Action Button */}
                    <button
                      onClick={(e) => toggleBookmark(e, listing.id)}
                      title={isBookmarked ? "Remove Bookmark" : "Save Item"}
                      style={{
                        position: 'absolute',
                        top: '0.65rem',
                        right: '0.65rem',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        color: isBookmarked ? '#ef4444' : 'var(--text-muted)',
                        fontSize: '0.95rem',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <i className={isBookmarked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                    </button>
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        lineHeight: '1.35',
                        color: 'var(--text-main)',
                        marginBottom: '0.35rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {listing.title}
                      </h3>

                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '0.85rem'
                      }}>
                        {listing.description || 'No description provided.'}
                      </p>

                      {/* Seller Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        <i className="fa-solid fa-user-shield" style={{ color: 'var(--brandblue)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                          @{listing.seller_handle || 'anonymous'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--brandblue)', fontWeight: '600' }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: '0.25rem' }} /> Verified
                        </span>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      gap: '1.25rem',
                      paddingTop: '0.85rem',
                      marginTop: '0.5rem',
                      borderTop: '1px solid var(--border)'
                    }}>
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.3rem',
                          fontWeight: '800',
                          color: 'var(--brandblue)',
                          letterSpacing: '-0.02em'
                        }}>
                          ₦{priceFormatted}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isMine ? (
                          <span style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            color: 'var(--brandblue)',
                            backgroundColor: 'var(--lightblue)',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '9999px'
                          }}>
                            Your Item
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleOpenChat(listing, e)}
                            style={{
                              backgroundColor: 'var(--brandblue)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.82rem',
                              fontFamily: 'var(--font-display)',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: 'var(--shadow-blue)',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <i className="fa-regular fa-comment-dots" />
                            Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedListing}
          allListings={listings}
          onSelectListing={(item) => setSelectedListing(item)}
          onClose={() => setSelectedListing(null)}
          onMessageSeller={(targetListing) => {
            setSelectedListing(null);
            handleOpenChat(targetListing);
          }}
          currentUserId={currentUserId}
        />
      )}

      {/* Chat Modal */}
      {chatListing && (
        <ChatModal 
          isOpen={true}
          listing={chatListing}
          onClose={() => setChatListing(null)}
        />
      )}

      {/* Create Listing Modal */}
      {isCreateOpen && (
        <CreateListingModal 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            fetchListings();
          }}
        />
      )}

      {/* Friendly Guest Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--lightblue)', color: 'var(--brandblue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.25rem auto' }}>
              <i className="fa-solid fa-comments" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Join CampusStash Chat
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Log in or create a free student account to negotiate anonymously and chat with sellers in real time.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <button className="btn-primary" onClick={() => navigate('/auth')}>
                Log In / Sign Up
              </button>
              <button className="btn-secondary" onClick={() => setShowAuthPrompt(false)}>
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Dashboard;