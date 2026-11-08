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
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import SellerStorefrontModal from '../components/SellerStorefrontModal';
import CampusOnboardingModal from '../components/CampusOnboardingModal';
import { FoodIcon, BooksIcon, TechIcon, FashionIcon, DormIcon, StoresIcon } from '../components/ShopMateCategoryIcons';

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

// ShopMate 6-Tile Category Grid (Template Fidelity Vector SVGs)
const SHOPMATE_CATEGORIES = [
  { id: 'Food & Groceries', name: 'Food & Groceries', icon: FoodIcon, label: 'Food' },
  { id: 'Textbooks', name: 'Textbooks', icon: BooksIcon, label: 'Books' },
  { id: 'Electronics', name: 'Electronics', icon: TechIcon, label: 'Tech' },
  { id: 'Fashion & Apparel', name: 'Fashion & Apparel', icon: FashionIcon, label: 'Fashion' },
  { id: 'Dorm Essentials', name: 'Dorm Essentials', icon: DormIcon, label: 'Dorm' },
  { id: 'Stores', name: 'Stores', icon: StoresIcon, label: 'Stores' }
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkCarouselBounds = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(maxScroll > 6 && scrollLeft < maxScroll - 6);
    }
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const timer = setTimeout(checkCarouselBounds, 150);
    el.addEventListener('scroll', checkCarouselBounds, { passive: true });
    window.addEventListener('resize', checkCarouselBounds);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkCarouselBounds);
      window.removeEventListener('resize', checkCarouselBounds);
    };
  }, [checkCarouselBounds]);

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
  const campusPickerRef = useRef(null);

  // Mandatory Campus Selection Onboarding Gate for new users
  const [showCampusOnboarding, setShowCampusOnboarding] = useState(() => {
    try {
      const hasChosen = localStorage.getItem('campusstash_campus_selected');
      const activeCampus = localStorage.getItem('campusstash_campus_id');
      return !hasChosen || !activeCampus;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    if (!showCampusPicker) return;
    const handleClickOutside = (e) => {
      if (campusPickerRef.current && !campusPickerRef.current.contains(e.target)) {
        setShowCampusPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCampusPicker]);

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
  const [storefrontSeller, setStorefrontSeller] = useState(null);

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
    try {
      localStorage.setItem('campusstash_campus_selected', 'true');
    } catch (e) {}
  };

  const handleOnboardingSelectCampus = (campusId) => {
    handleSelectCampus(campusId);
    setShowCampusOnboarding(false);
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
        if (selCat === 'food & groceries' && !itemCat.includes('food') && !itemCat.includes('snack') && !itemCat.includes('drink') && !itemCat.includes('grocery') && !itemCat.includes('eat')) return false;
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
      const el = carouselRef.current;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      if (maxScroll <= 0) return;

      const cardWidth = 125;
      const step = cardWidth * 2;
      if (direction === 'left') {
        const target = Math.max(0, el.scrollLeft - step);
        el.scrollTo({ left: target, behavior: 'smooth' });
      } else {
        const target = Math.min(maxScroll, el.scrollLeft + step);
        el.scrollTo({ left: target, behavior: 'smooth' });
      }
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

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        filter: showCampusOnboarding ? 'blur(8px)' : 'none',
        pointerEvents: showCampusOnboarding ? 'none' : 'auto',
        userSelect: showCampusOnboarding ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        <main 
          className="animate-fade-in"
          style={{ 
            maxWidth: '100%', 
            margin: '0 auto', 
            width: '100%', 
            padding: Capacitor.isNativePlatform() ? '0.5rem 1.15rem 7rem 1.15rem' : '0.5rem 1.15rem 2.5rem 1.15rem', 
            boxSizing: 'border-box', 
            flex: 1
          }}
        >
        {/* ============================================================== */}
        {/* SHOPMATE TOP BAR: LOCATION & HEADER (TEMPLATE FIDELITY)         */}
        {/* ============================================================== */}
        <header className="shopmate-header">
          {/* Location Delivery Selector (Left Phone in Template) */}
          <div 
            className="shopmate-location-group"
            onClick={() => setShowCampusPicker(prev => !prev)}
            ref={campusPickerRef}
            title={`Select Campus (Current: ${activeCampusName})`}
          >
            <div className="shopmate-pin-circle">
              <i className="fa-solid fa-location-dot" />
            </div>
            <div className="shopmate-location-text">
              <span className="shopmate-location-delivery-to">Delivery to</span>
              <div className="shopmate-location-campus-name">
                <span>{activeCampusAcronym || activeCampusName || 'Select Campus'}</span>
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.62rem', opacity: 0.65 }} />
              </div>
            </div>

            {/* Campus Dropdown Popover */}
            {showCampusPicker && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 200,
                  minWidth: '270px',
                  maxWidth: '320px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleSelectCampus('')}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: !selectedCampusId ? 'var(--primary-light)' : 'transparent',
                    color: !selectedCampusId ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: !selectedCampusId ? '700' : '500',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>🌐 All Campuses</span>
                </button>
                {campuses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCampus(c.id)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: selectedCampusId === c.id ? 'var(--primary-light)' : 'transparent',
                      color: selectedCampusId === c.id ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: selectedCampusId === c.id ? '700' : '500',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🎓 {c.name} ({c.acronym})
                    </span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.6, flexShrink: 0, fontWeight: '600' }}>
                      {c.state}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Header Actions: Theme Toggle & Avatar */}
          <div className="shopmate-header-actions">
            <ThemeToggleBtn />

            {/* Saved Items Quick Heart */}
            <button
              className="shopmate-header-btn"
              onClick={() => navigate('/profile?tab=saved')}
              title="Saved Items"
            >
              <i className="fa-regular fa-heart" />
            </button>

            {/* User Avatar */}
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0
              }}
              title="My Account"
            >
              {currentUser?.avatar_url ? (
                <img 
                  src={getImageUrl(currentUser.avatar_url)} 
                  alt="User" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>
                  {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : <i className="fa-regular fa-user" />}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* SHOPMATE HERO HEADLINE (MATCHING TEMPLATE TEXT & WEIGHT)       */}
        {/* ============================================================== */}
        <h1 className="shopmate-hero-headline">
          Everything you need,<br />
          <span className="shopmate-hero-accent">delivered fast.</span>
        </h1>

        {/* ============================================================== */}
        {/* SHOPMATE ROUNDED PILL SEARCH BAR WITH SCANNER ICON             */}
        {/* ============================================================== */}
        <div className="shopmate-search-bar">
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginRight: '0.4rem' }} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for food, groceries, or stores..."
            className="shopmate-search-input"
          />
          {searchQuery ? (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
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
          ) : (
            <button 
              className="shopmate-search-scanner-btn"
              onClick={() => {
                setPriceRangeIndex(prev => (prev + 1) % PRICE_RANGES.length);
              }}
              title={`Filter by Price: ${PRICE_RANGES[priceRangeIndex].label}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* SHOPMATE 6-TILE CATEGORY GRID (HANDCRAFTED 3D VECTOR ICONS)   */}
        {/* ============================================================== */}
        <div className="shopmate-cat-grid">
          {SHOPMATE_CATEGORIES.map(cat => {
            const IconComponent = cat.icon;
            const isActive = selectedCategory === cat.name;
            return (
              <div
                key={cat.id}
                className={`shopmate-cat-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (cat.name === 'Stores') {
                    navigate('/discover');
                  } else {
                    setSelectedCategory(prev => prev === cat.name ? 'All' : cat.name);
                  }
                }}
              >
                <div className="shopmate-cat-icon">
                  <IconComponent size={42} />
                </div>
                <span className="shopmate-cat-name">{cat.label}</span>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* SHOPMATE FRESH PICKS BANNER (MATCHING RIGHT PHONE SCREEN)     */}
        {/* ============================================================== */}
        <div className="shopmate-promo-banner">
          <div className="shopmate-promo-content">
            <h3 className="shopmate-promo-title">This week's fresh picks</h3>
            <p className="shopmate-promo-sub">100% verified campus stash, delivered within 15 mins...</p>
            <button 
              className="shopmate-promo-btn"
              onClick={handleOpenCreateModal}
            >
              Shop Now
            </button>
          </div>
          <div className="shopmate-promo-graphic">
            <BooksIcon size={64} />
          </div>
        </div>
        {/* 3-Dot Carousel Indicator */}
        <div className="shopmate-carousel-dots">
          <span className="dot active" />
          <span className="dot" />
          <span className="dot" />
        </div>

        {/* ============================================================== */}
        {/* FEED SECTION HEADER & TABS                                     */}
        {/* ============================================================== */}
        <div className="shopmate-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setActiveTab('items')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1.15rem',
                fontWeight: '800',
                color: activeTab === 'items' ? 'var(--text-main)' : 'var(--text-light)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.015em'
              }}
            >
              {selectedCategory === 'All' ? 'Popular near you' : selectedCategory}
            </button>
            <span style={{ color: 'var(--border)' }}>•</span>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1rem',
                fontWeight: '700',
                color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-light)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Wanted Board ({requests.length})
            </button>
          </div>

          {activeTab === 'items' && (
            <button 
              className="shopmate-section-link"
              onClick={() => setSelectedCategory('All')}
            >
              {selectedCategory !== 'All' ? 'See all' : `${filteredListings.length} items`}
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: SHOPMATE 2-COLUMN PRODUCT CARDS (1:1 FIDELITY)         */}
        {/* ============================================================== */}
        {activeTab === 'items' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>Loading campus listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                backgroundColor: 'var(--surface)',
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
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  margin: '0 auto 1rem auto'
                }}>
                  <i className="fa-solid fa-store-slash" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
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
              <div className="shopmate-grid-2col">
                {filteredListings.map(listing => {
                  const isSold = listing.status === 'sold';
                  const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
                  const priceFormatted = rawPrice.toLocaleString(undefined, { maximumFractionDigits: (rawPrice % 1 === 0 ? 0 : 2) });
                  const isBookmarked = Array.isArray(savedItemIds) && savedItemIds.includes(listing.id);
                  const isStore = listing.seller?.account_type === 'store';
                  const sellerName = isStore && listing.seller?.business_name
                    ? listing.seller.business_name
                    : (listing.seller_handle ? listing.seller_handle.split('@').pop() : (listing.seller?.burner_handle ? listing.seller.burner_handle.split('@').pop() : (listing.seller?.name || 'Student')));

                  return (
                    <article 
                      key={listing.id}
                      className="shopmate-card"
                      onClick={() => setSelectedListing(listing)}
                    >
                      {/* Image Box */}
                      <div className="shopmate-card-image-wrap">
                        {listing.image_url ? (
                          <img 
                            src={getImageUrl(listing.image_url)} 
                            alt={listing.title} 
                            loading="lazy"
                            className="shopmate-card-img"
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

                        {/* Top-Right Heart Bookmark Button (Delicate Outline) */}
                        <button
                          type="button"
                          className={`shopmate-card-heart-btn ${isBookmarked ? 'active' : ''}`}
                          onClick={(e) => toggleBookmark(e, listing.id)}
                          title={isBookmarked ? "Remove Bookmark" : "Save Item"}
                        >
                          <i className={isBookmarked ? "fa-solid fa-heart" : "fa-regular fa-heart"} />
                        </button>
                      </div>

                      {/* Card Tag Pill (Small Muted Pill e.g. 300g in Template) */}
                      <span className="shopmate-card-tag">
                        {listing.category || 'Item'}
                      </span>

                      {/* Card Title */}
                      <h3 className="shopmate-card-title" title={listing.title}>
                        {listing.title}
                      </h3>

                      {/* Card Meta / Delivery (⏱ 10 MINS in Template) */}
                      <div className="shopmate-card-meta">
                        <i className="fa-regular fa-clock" style={{ fontSize: '0.65rem' }} />
                        <span>15 MINS • by {sellerName}</span>
                      </div>

                      {/* Footer: Price + Circular Green Plus Action Button */}
                      <div className="shopmate-card-footer">
                        <div className="shopmate-card-price">
                          ₦{priceFormatted}
                        </div>
                        <button
                          type="button"
                          className="shopmate-card-plus-btn"
                          title="View & Chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListing(listing);
                          }}
                        >
                          <i className="fa-solid fa-plus" />
                        </button>
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
                backgroundColor: 'var(--surface)',
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
                        backgroundColor: 'var(--surface)',
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

        <Footer />
      </div>

      {/* Item Detail Modal */}
      {selectedListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onMessageSeller={(item) => handleOpenChat(item)}
          onOpenStorefront={(vendor) => {
            setSelectedListing(null);
            setStorefrontSeller(vendor);
          }}
          onRequireAuth={() => {
            setSelectedListing(null);
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
          onClose={() => {
            setIsCreateOpen(false);
            fetchListings();
          }}
          onSuccess={() => {
            fetchListings();
          }}
          onCreated={() => {
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

      {/* Seller Campus Storefront Modal */}
      {storefrontSeller && (
        <SellerStorefrontModal
          isOpen={true}
          sellerId={storefrontSeller.seller_id}
          sellerHandle={storefrontSeller.seller_handle}
          initialSellerName={storefrontSeller.seller_name}
          onClose={() => setStorefrontSeller(null)}
          onSelectItem={(item) => {
            setStorefrontSeller(null);
            setSelectedListing(item);
          }}
          onMessageSeller={(vendor) => {
            setStorefrontSeller(null);
            handleOpenChat(vendor);
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
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)} style={{ zIndex: 2000 }}>
          <div 
            className="modal-content animate-fade-in" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '380px', 
              padding: '2rem 1.5rem', 
              borderRadius: '24px', 
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
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

      {/* Mandatory Campus Selection Onboarding Gate (GPS Auto-Detect or Manual Select) */}
      <CampusOnboardingModal
        isOpen={showCampusOnboarding}
        campuses={campuses}
        currentCampusId={selectedCampusId}
        onSelectCampus={handleOnboardingSelectCampus}
      />
    </div>
  );
}

export default Dashboard;
