import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  apiFetch, 
  getImageUrl, 
  getCampuses, 
  getActiveCampusId, 
  setActiveCampusId, 
  DEFAULT_CAMPUSES,
  getItemRequests, 
  fulfillItemRequest, 
  deleteItemRequest 
} from '../api';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ItemDetailModal from '../components/ItemDetailModal';
import ChatModal from '../components/ChatModal';
import CreateListingModal from '../components/CreateListingModal';
import EditListingModal from '../components/EditListingModal';
import CreateRequestModal from '../components/CreateRequestModal';

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

// Curated Aesthetic Trending Categories with visual cards
const TRENDING_CATEGORIES = [
  { 
    name: 'Textbooks', 
    label: 'Textbooks', 
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80' 
  },
  { 
    name: 'Electronics', 
    label: 'Tech & Gear', 
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80' 
  },
  { 
    name: 'Fashion & Apparel', 
    label: 'Apparel', 
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80' 
  },
  { 
    name: 'Dorm Essentials', 
    label: 'Dorm & Living', 
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' 
  },
  { 
    name: 'All', 
    label: 'All Items', 
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80' 
  }
];

const PRICE_RANGES = [
  { label: 'All Prices', min: null, max: null },
  { label: 'Under ₦5,000', min: 0, max: 5000 },
  { label: '₦5,000 - ₦20,000', min: 5000, max: 20000 },
  { label: 'Over ₦20,000', min: 20000, max: null }
];

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeItemId } = useParams();
  const carouselRef = useRef(null);

  // Active view: 'items' (Marketplace) vs 'requests' (Daily Requests / Wanted Board)
  const [activeTab, setActiveTab] = useState('items');

  // Campus scoping
  const [campuses, setCampuses] = useState(() => {
    try {
      const cached = localStorage.getItem('campusstash_cached_campuses');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUSES;
    } catch (e) {
      return DEFAULT_CAMPUSES;
    }
  });
  const [selectedCampusId, setSelectedCampusId] = useState(() => getActiveCampusId());
  const [showCampusPicker, setShowCampusPicker] = useState(false);

  // User profile preview for top bar avatar
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Listings state
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

  // Student Wanted Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Modals and Active Views
  const [selectedListing, setSelectedListing] = useState(null);
  const [chatListing, setChatListing] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState('Join CampusStash');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingListing, setEditingListing] = useState(null);

  // Bookmarked item IDs saved in localStorage
  const [savedItemIds, setSavedItemIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_listings') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Extract current user ID from JWT & fetch /users/me if needed
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.sub) {
        setCurrentUserId(decoded.sub);
      }
      if (!currentUser) {
        apiFetch('/users/me')
          .then(data => {
            if (data) {
              setCurrentUser(data);
              localStorage.setItem('user', JSON.stringify(data));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Fetch campus list
  useEffect(() => {
    getCampuses().then(data => {
      if (Array.isArray(data)) setCampuses(data);
    }).catch(() => {});

    const onCampusChange = (e) => {
      const newId = e.detail !== undefined ? e.detail : getActiveCampusId();
      setSelectedCampusId(newId);
    };
    window.addEventListener('campusstash:campus_changed', onCampusChange);
    return () => window.removeEventListener('campusstash:campus_changed', onCampusChange);
  }, []);

  const handleSelectCampus = (campusId) => {
    setSelectedCampusId(campusId);
    setActiveCampusId(campusId);
    setShowCampusPicker(false);
  };

  const toggleBookmark = (e, listingId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthPromptMessage('Save Favorite Items');
      setShowAuthPrompt(true);
      return;
    }
    setSavedItemIds(prev => {
      const updated = prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem('saved_listings', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch marketplace listings with campus scoping
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      let query = '/listings/';
      const params = new URLSearchParams();

      if (selectedCampusId) {
        params.append('campus_id', selectedCampusId);
      }
      
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
      if (selectedCategory === 'All' && !searchQuery.trim() && !selectedCampusId && itemsList.length > 0) {
        try {
          localStorage.setItem('cs_cached_listings', JSON.stringify(itemsList));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
      setListings(prev => {
        if (prev.length > 0) return prev;
        try {
          const cached = localStorage.getItem('cs_cached_listings');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 2) return parsed;
          }
          return [];
        } catch (e) {
          return [];
        }
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCampusId, selectedCategory, searchQuery, sortOption, priceRangeIndex]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Fetch Wanted Board requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await getItemRequests(selectedCampusId);
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && Array.isArray(data.items)) {
        setRequests(data.items);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn("Failed to fetch student requests", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [selectedCampusId]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab, fetchRequests]);

  // Deep-linking: auto-open listing if URL contains ?item={id} or /listing/:id route
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = routeItemId || params.get('item');
    if (itemId) {
      const match = listings.find(l => l.id === itemId);
      if (match) {
        setSelectedListing(match);
      } else {
        apiFetch(`/listings/${itemId}`)
          .then(item => {
            if (item && item.id) setSelectedListing(item);
          })
          .catch(() => {});
      }
    }
  }, [listings, routeItemId]);

  // Re-fetch when user returns to the tab after being away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchListings();
        if (activeTab === 'requests') fetchRequests();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let capListener = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          fetchListings();
          if (activeTab === 'requests') fetchRequests();
        }
      }).then(listener => { capListener = listener; });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (capListener) capListener.remove();
    };
  }, [fetchListings, fetchRequests, activeTab]);

  // Client-side instant filter fallback for responsiveness
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      if (selectedCampusId && item.campus_id && item.campus_id !== selectedCampusId) {
        return false;
      }
      if (selectedCategory !== 'All') {
        const itemCat = (item.category || '').toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        if (selCat === 'textbooks' && !itemCat.includes('textbook') && !itemCat.includes('book')) return false;
        if (selCat === 'electronics' && !itemCat.includes('elect') && !itemCat.includes('tech') && !itemCat.includes('gear')) return false;
        if (selCat === 'fashion & apparel' && !itemCat.includes('fashion') && !itemCat.includes('apparel') && !itemCat.includes('wear')) return false;
        if (selCat === 'dorm essentials' && !itemCat.includes('dorm') && !itemCat.includes('living') && !itemCat.includes('home')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
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
  }, [listings, selectedCampusId, selectedCategory, searchQuery, priceRangeIndex, sortOption]);

  useEffect(() => {
    if (location.state?.openCreateModal) {
      handleOpenCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleOpenCreateModal = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthPromptMessage('Post Items for Sale');
      setShowAuthPrompt(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleOpenCreateRequest = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthPromptMessage('Post What You Need');
      setShowAuthPrompt(true);
      return;
    }
    setIsRequestModalOpen(true);
  };

  const handleOpenChat = (listing, e = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthPromptMessage('Message Student Sellers');
      setShowAuthPrompt(true);
      return;
    }
    setChatListing(listing);
  };

  const handleIHaveThis = (req) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthPromptMessage('Connect with Requesters');
      setShowAuthPrompt(true);
      return;
    }
    if (currentUserId && req.user_id === currentUserId) {
      alert("This is your own request!");
      return;
    }
    setChatListing({
      id: null,
      request_id: req.id,
      title: `Wanted: ${req.title}`,
      seller_id: req.user_id,
      seller_handle: req.user_handle || 'student',
      price: req.budget_kobo ? (req.budget_kobo / 100) : (req.budget_naira || 0),
      is_request_chat: true
    });
  };

  const handleScrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeCampusName = campuses.find(c => c.id === selectedCampusId)?.name || 'Lead City University';
  const activeCampusAcronym = campuses.find(c => c.id === selectedCampusId)?.acronym || 'LCU';

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        onPrimaryAction={handleOpenCreateModal}
        primaryActionText="Sell an Item"
      />

      <main 
        className="animate-fade-in"
        style={{ 
          maxWidth: '100%', 
          margin: '0 auto', 
          width: '100%', 
          padding: '0.5rem 1.15rem 7rem 1.15rem', 
          boxSizing: 'border-box', 
          flex: 1 
        }}
      >
        {/* ============================================================== */}
        {/* AESTHETIC MINIMAL TOP BAR: AVATAR & CAMPUS SELECTOR PILL       */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          position: 'relative'
        }}>
          {/* User Circular Avatar */}
          <div 
            onClick={() => {
              const token = localStorage.getItem('token');
              if (!token) {
                navigate('/auth');
              } else {
                navigate('/profile');
              }
            }}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(120, 95, 75, 0.12)',
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--terracotta)',
              flexShrink: 0
            }}
            title="View Profile"
          >
            {currentUser?.avatar_url ? (
              <img 
                src={getImageUrl(currentUser.avatar_url)} 
                alt="User" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span style={{ fontWeight: '700', fontSize: '1rem', fontFamily: 'var(--font-sans)' }}>
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <i className="fa-regular fa-user" />}
              </span>
            )}
          </div>

          {/* Campus Selector Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCampusPicker(prev => !prev)}
              className="campus-pill-btn"
              title="Select Campus"
            >
              <span>🎓</span>
              <span>{activeCampusAcronym ? `${activeCampusName} (${activeCampusAcronym})` : 'All Campuses'}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.72rem', opacity: 0.65 }} />
            </button>

            {/* Campus Dropdown Popover */}
            {showCampusPicker && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 100,
                  minWidth: '240px',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                <button
                  onClick={() => handleSelectCampus('')}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: !selectedCampusId ? 'var(--surface-alt)' : 'transparent',
                    color: !selectedCampusId ? 'var(--terracotta)' : 'var(--text-main)',
                    fontWeight: !selectedCampusId ? '700' : '500',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🌐 All Nigerian Campuses
                </button>
                {campuses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCampus(c.id)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: selectedCampusId === c.id ? 'var(--surface-alt)' : 'transparent',
                      color: selectedCampusId === c.id ? 'var(--terracotta)' : 'var(--text-main)',
                      fontWeight: selectedCampusId === c.id ? '700' : '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🎓 {c.name} ({c.acronym})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* EDITORIAL SERIF HEADLINE                                        */}
        {/* ============================================================== */}
        <h1 className="aesthetic-headline">
          Find what you need<br />today, {activeCampusAcronym || 'Campus'} 🎓
        </h1>

        {/* ============================================================== */}
        {/* AESTHETIC ROUNDED PILL SEARCH BAR                              */}
        {/* ============================================================== */}
        <div className="aesthetic-search-container">
          <i className="fa-solid fa-magnifying-glass aesthetic-search-icon" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search textbooks, calculators, tech..."
            className="aesthetic-search-input"
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
                fontSize: '1rem',
                padding: '0.2rem'
              }}
              title="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* "TRENDING ON CAMPUS" CAROUSEL                                  */}
        {/* ============================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="trending-header">
            <h2 className="trending-header-title">Trending on Campus</h2>
            <div className="trending-nav-arrows">
              <button 
                className="trending-arrow-btn"
                onClick={() => handleScrollCarousel('left')}
                title="Scroll Left"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button 
                className="trending-arrow-btn"
                onClick={() => handleScrollCarousel('right')}
                title="Scroll Right"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>

          <div className="trending-scroll-row" ref={carouselRef}>
            {TRENDING_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.name;
              return (
                <div 
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`trending-card ${isActive ? 'active' : ''}`}
                >
                  <img 
                    src={cat.image} 
                    alt={cat.label} 
                    className="trending-card-img" 
                  />
                  <div className="trending-card-overlay">
                    <span className="trending-card-title">{cat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* MARKETPLACE SECTION & SUBTLE FEED TOGGLE                       */}
        {/* ============================================================== */}
        <div className="marketplace-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setActiveTab('items')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1.25rem',
                fontWeight: '700',
                color: activeTab === 'items' ? 'var(--text-main)' : 'var(--text-light)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.01em'
              }}
            >
              Marketplace
            </button>
            <span style={{ color: 'var(--border)' }}>•</span>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1.1rem',
                fontWeight: '600',
                color: activeTab === 'requests' ? 'var(--terracotta)' : 'var(--text-light)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Daily Requests ({requests.length})
            </button>
          </div>

          {activeTab === 'items' && selectedCategory !== 'All' && (
            <button 
              className="marketplace-see-all"
              onClick={() => setSelectedCategory('All')}
            >
              See all
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: AESTHETIC MINIMAL MARKETPLACE GRID (2-COLUMN)          */}
        {/* ============================================================== */}
        {activeTab === 'items' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>Loading campus listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                marginTop: '1rem',
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
                  <i className="fa-solid fa-store-slash" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  No Items Listed Here Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                  Be the first student to post an item on {activeCampusAcronym}!
                </p>
                <button 
                  className="btn-primary" 
                  onClick={handleOpenCreateModal}
                  style={{ borderRadius: '9999px', padding: '0.65rem 1.4rem' }}
                >
                  <i className="fa-solid fa-plus" /> List an Item
                </button>
              </div>
            ) : (
              <div className="aesthetic-grid-2col">
                {filteredListings.map(listing => {
                  const isSold = listing.status === 'sold';
                  const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
                  const priceFormatted = rawPrice.toLocaleString(undefined, { maximumFractionDigits: (rawPrice % 1 === 0 ? 0 : 2) });
                  const isBookmarked = Array.isArray(savedItemIds) && savedItemIds.includes(listing.id);
                  const sellerName = listing.seller_handle ? listing.seller_handle.split('@').pop() : 'Seller';

                  return (
                    <article 
                      key={listing.id}
                      className="aesthetic-card"
                      onClick={() => setSelectedListing(listing)}
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

                        {/* Top-Left Pill: by {Seller} • Active */}
                        <div className="aesthetic-card-seller-pill">
                          <span>by {sellerName}</span>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <span style={{ color: isSold ? '#ef4444' : '#2E7D32' }}>
                            {isSold ? 'Sold' : 'Active'}
                          </span>
                        </div>

                        {/* Top-Right Heart Button */}
                        <button
                          type="button"
                          className={`aesthetic-card-heart-btn ${isBookmarked ? 'active' : ''}`}
                          onClick={(e) => toggleBookmark(e, listing.id)}
                          title={isBookmarked ? "Remove Bookmark" : "Save Item"}
                        >
                          <i className={isBookmarked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
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
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DAILY REQUESTS (WANTED BOARD)                          */}
        {/* ============================================================== */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                What students on campus are currently looking for:
              </p>
              <button 
                className="btn-primary" 
                onClick={handleOpenCreateRequest}
                style={{ borderRadius: '9999px', padding: '0.45rem 1rem', fontSize: '0.84rem' }}
              >
                <i className="fa-solid fa-plus" /> Post Request
              </button>
            </div>

            {loadingRequests ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '1.8rem', color: 'var(--terracotta)', marginBottom: '0.5rem' }} />
                <p>Loading student requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid var(--border)'
              }}>
                <i className="fa-solid fa-bullhorn" style={{ fontSize: '1.8rem', color: 'var(--terracotta)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>No Requests Yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Looking for a specific book or gadget? Let campus peers know!
                </p>
                <button className="btn-primary" onClick={handleOpenCreateRequest} style={{ borderRadius: '9999px' }}>
                  Post What You Need
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {requests.map(req => {
                  const budgetFormatted = (req.budget_kobo ? (req.budget_kobo / 100) : (req.budget_naira || 0)).toLocaleString();
                  return (
                    <div 
                      key={req.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border)',
                        borderRadius: '18px',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span style={{
                            backgroundColor: 'var(--surface-alt)',
                            color: 'var(--text-main)',
                            borderRadius: '9999px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: '600'
                          }}>
                            Wanted
                          </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--terracotta)' }}>
                            ₦{budgetFormatted}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                          {req.title}
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: '1.45', margin: 0 }}>
                          {req.description || 'No additional details provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.65rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          by @{req.user_handle || 'student'}
                        </span>
                        <button
                          className="btn-primary"
                          onClick={() => handleIHaveThis(req)}
                          style={{ borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                        >
                          I Have This
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onMessageSeller={(item) => handleOpenChat(item)}
          onRequireAuth={() => {
            setAuthPromptMessage('Message Student Sellers');
            setShowAuthPrompt(true);
          }}
          currentUserId={currentUserId}
          onEditListing={(item) => {
            setSelectedListing(null);
            setEditingListing(item);
          }}
          allListings={listings}
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
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchListings();
          }}
        />
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal 
          isOpen={true}
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => {
            setEditingListing(null);
            fetchListings();
          }}
        />
      )}

      {/* Create Request Modal */}
      {isRequestModalOpen && (
        <CreateRequestModal 
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            fetchRequests();
          }}
        />
      )}

      {/* Quick Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div 
            className="modal-content animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '380px', 
              padding: '2rem 1.5rem', 
              borderRadius: '24px', 
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)'
            }}
          >
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
              <i className="fa-solid fa-lock" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              {authPromptMessage}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Sign in to your campus account to buy, sell, save items, and message student peers safely.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/auth')}
                style={{ width: '100%', borderRadius: '9999px', padding: '0.75rem' }}
              >
                Sign In or Register
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowAuthPrompt(false)}
                style={{ width: '100%', borderRadius: '9999px', padding: '0.75rem' }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
