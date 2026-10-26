import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  apiFetch, 
  getImageUrl, 
  getCampuses, 
  getActiveCampusId, 
  setActiveCampusId, 
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
  const location = useLocation();

  // Active top-level tab: 'items' (Available Items) vs 'requests' (Student Requests / Wanted Board)
  const [activeTab, setActiveTab] = useState('items');

  // Campus scoping
  const [campuses, setCampuses] = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState(() => getActiveCampusId());

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

  // Extract current user ID from JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.sub) {
        setCurrentUserId(decoded.sub);
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
          return cached ? JSON.parse(cached) : [];
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

  // Deep-linking: auto-open listing if URL contains ?item={id}
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('item');
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
  }, [listings]);

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
      // Campus filter
      if (selectedCampusId && item.campus_id && item.campus_id !== selectedCampusId) {
        return false;
      }
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
    // Launch chat modal with the request details
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

  const handleFulfillRequest = async (requestId) => {
    try {
      await fulfillItemRequest(requestId);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Delete this request from the wanted board?')) return;
    try {
      await deleteItemRequest(requestId);
      fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to delete request');
    }
  };

  const activeCampusName = campuses.find(c => c.id === selectedCampusId)?.name || 'All Nigerian Campuses';
  const activeCampusAcronym = campuses.find(c => c.id === selectedCampusId)?.acronym || 'All';

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
            marginBottom: '1.5rem',
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
            
            {/* Campus Scope Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--lightblue)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              color: 'var(--brandblue)',
              marginBottom: '0.85rem'
            }}>
              <i className="fa-solid fa-location-dot" />
              <span>Campus: {activeCampusName} ({activeCampusAcronym})</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: '800',
              letterSpacing: '-0.035em',
              color: 'var(--text-main)',
              lineHeight: '1.18'
            }}>
              Campus <span className="text-brandblue">Marketplace</span> & Wanted Board
            </h1>

            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              marginTop: '0.5rem',
              marginBottom: '1.25rem',
              lineHeight: '1.5'
            }}>
              Buy, sell, and request items directly from trusted students on your campus. Zero platform fees, safe public meetups.
            </p>

            {/* Interactive Live Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
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

            {/* Quick Campus Filter Pills */}
            <div style={{
              display: 'flex',
              gap: '0.45rem',
              flexWrap: 'wrap',
              marginTop: '1.1rem',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '0.2rem' }}>
                Quick Switch:
              </span>
              <button
                onClick={() => handleSelectCampus('')}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: !selectedCampusId ? 'var(--brandblue)' : 'var(--border)',
                  backgroundColor: !selectedCampusId ? 'var(--brandblue)' : 'var(--surface)',
                  color: !selectedCampusId ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                All Campuses
              </button>
              {campuses.map(c => {
                const isSelected = selectedCampusId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCampus(c.id)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--brandblue)' : 'var(--border)',
                      backgroundColor: isSelected ? 'var(--brandblue)' : 'var(--surface)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      fontFamily: 'var(--font-display)',
                      cursor: 'pointer'
                    }}
                  >
                    {c.acronym}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Top-Level Tabs: [Available Items] | [Student Requests (Wanted Board)] */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--surface-alt)',
            padding: '0.35rem',
            borderRadius: '9999px',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => setActiveTab('items')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeTab === 'items' ? 'var(--brandblue)' : 'transparent',
                color: activeTab === 'items' ? '#ffffff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === 'items' ? 'var(--shadow-blue)' : 'none'
              }}
            >
              <i className="fa-solid fa-store" />
              <span>Available Items</span>
              <span style={{
                backgroundColor: activeTab === 'items' ? 'rgba(255,255,255,0.25)' : 'var(--surface)',
                color: activeTab === 'items' ? '#ffffff' : 'var(--brandblue)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                marginLeft: '0.2rem'
              }}>
                {filteredListings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeTab === 'requests' ? 'var(--brandblue)' : 'transparent',
                color: activeTab === 'requests' ? '#ffffff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: activeTab === 'requests' ? 'var(--shadow-blue)' : 'none'
              }}
            >
              <i className="fa-solid fa-bullhorn" />
              <span>Student Requests (Wanted Board)</span>
              <span style={{
                backgroundColor: activeTab === 'requests' ? 'rgba(255,255,255,0.25)' : 'var(--surface)',
                color: activeTab === 'requests' ? '#ffffff' : 'var(--brandblue)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                marginLeft: '0.2rem'
              }}>
                {requests.length}
              </span>
            </button>
          </div>

          {/* Quick Action Button */}
          {activeTab === 'requests' ? (
            <button
              className="btn-primary"
              onClick={handleOpenCreateRequest}
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.88rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'var(--shadow-blue)'
              }}
            >
              <i className="fa-solid fa-plus" />
              <span>Post What You Need</span>
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleOpenCreateModal}
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.88rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'var(--shadow-blue)'
              }}
            >
              <i className="fa-solid fa-plus" />
              <span>Sell an Item</span>
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: AVAILABLE ITEMS                                          */}
        {/* ============================================================== */}
        {activeTab === 'items' && (
          <>
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
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {PRICE_RANGES.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPriceRangeIndex(idx)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: priceRangeIndex === idx ? 'var(--brandblue)' : 'var(--border)',
                      backgroundColor: priceRangeIndex === idx ? 'var(--lightblue)' : 'transparent',
                      color: priceRangeIndex === idx ? 'var(--brandblue)' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sort:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Listings Grid or Loading / Empty States */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.4rem', color: 'var(--brandblue)', marginBottom: '1rem' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600' }}>Discovering student listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px dashed var(--border)',
                marginTop: '1rem'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lightblue)',
                  color: 'var(--brandblue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <i className="fa-solid fa-store-slash" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  No Items Listed Here Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
                  Be the first student to list textbooks, electronics, or dorm gear on this campus!
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={handleOpenCreateModal}>
                    <i className="fa-solid fa-plus" /> List an Item Now
                  </button>
                  <button className="btn-secondary" onClick={() => handleSelectCampus('')}>
                    View All Campuses
                  </button>
                </div>
              </div>
            ) : (
              <div className="listings-grid">
                {filteredListings.map(listing => {
                  const isSold = listing.status === 'sold';
                  const priceFormatted = (listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });
                  const isMine = currentUserId && listing.seller_id === currentUserId;
                  const isBookmarked = savedItemIds.includes(listing.id);
                  const campusBadge = listing.campus_acronym || 'Campus';

                  return (
                    <div 
                      key={listing.id}
                      className="listing-card"
                      onClick={() => setSelectedListing(listing)}
                      style={{
                        cursor: 'pointer',
                        opacity: isSold ? 0.78 : 1,
                        position: 'relative'
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
                        
                        {/* Category & Campus Badges */}
                        <div style={{
                          position: 'absolute',
                          top: '0.65rem',
                          left: '0.65rem',
                          display: 'flex',
                          gap: '0.4rem',
                          alignItems: 'center',
                          flexWrap: 'wrap'
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

                          <div style={{
                            padding: '0.28rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            backgroundColor: 'var(--brandblue)',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            {campusBadge}
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
                      <div className="listing-card-body">
                        <div>
                          <h3 className="listing-card-title">
                            {listing.title}
                          </h3>

                          <p className="listing-card-desc">
                            {listing.description || 'No description provided.'}
                          </p>

                          {/* Seller Tag */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
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
                        <div className="listing-card-footer">
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
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: WANTED BOARD (STUDENT REQUESTS)                         */}
        {/* ============================================================== */}
        {activeTab === 'requests' && (
          <div>
            {/* Wanted Board Info Header */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  color: 'var(--text-main)',
                  margin: '0 0 0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fa-solid fa-bullhorn" style={{ color: 'var(--brandblue)' }} />
                  Campus Wanted Board
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Students looking for items right now. Have what they need? Tap <strong>"I Have This"</strong> to chat directly!
                </p>
              </div>

              {campuses.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Filtering for:</span>
                  <span style={{
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--brandblue)',
                    backgroundColor: 'var(--lightblue)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px'
                  }}>
                    {activeCampusName}
                  </span>
                </div>
              )}
            </div>

            {loadingRequests ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--brandblue)', marginBottom: '0.75rem' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600' }}>Loading student requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 1.5rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px dashed var(--border)'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--lightblue)',
                  color: 'var(--brandblue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  margin: '0 auto 1.25rem auto'
                }}>
                  <i className="fa-solid fa-box-open" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  No Requests Posted Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
                  Need a textbook, dorm fan, scientific calculator, or pressing iron? Post what you need and campus sellers will reach out!
                </p>
                <button className="btn-primary" onClick={handleOpenCreateRequest}>
                  <i className="fa-solid fa-plus" /> Post What You Need
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem'
              }}>
                {requests.map(req => {
                  const isMine = currentUserId && req.user_id === currentUserId;
                  const budgetFormatted = (req.budget_naira || (req.budget_kobo ? req.budget_kobo / 100 : 0)).toLocaleString();
                  const campusBadge = req.campus_acronym || 'Campus';

                  return (
                    <div
                      key={req.id}
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div>
                        {/* Top Badge Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            backgroundColor: 'var(--lightblue)',
                            color: 'var(--brandblue)',
                            padding: '0.22rem 0.6rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <i className="fa-solid fa-graduation-cap" /> {campusBadge}
                          </span>

                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.15rem',
                            fontWeight: '800',
                            color: 'var(--brandblue)'
                          }}>
                            {budgetFormatted && budgetFormatted !== '0' ? `₦${budgetFormatted}` : 'Open Budget'}
                          </span>
                        </div>

                        {/* Request Title */}
                        <h4 style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.05rem',
                          fontWeight: '800',
                          color: 'var(--text-main)',
                          marginBottom: '0.4rem',
                          lineHeight: '1.3',
                          minHeight: '2.6rem'
                        }}>
                          Looking for: {req.title}
                        </h4>

                        {/* Request Description */}
                        {req.description && (
                          <p style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.85rem',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {req.description}
                          </p>
                        )}

                        {/* Requester Handle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <i className="fa-solid fa-user-shield" style={{ color: 'var(--brandblue)' }} />
                          <span style={{ fontWeight: '600', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                            @{req.user_handle || 'student'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--brandblue)', fontWeight: '600' }}>
                            <i className="fa-solid fa-circle-check" style={{ marginRight: '0.2rem' }} /> Requester
                          </span>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border)'
                      }}>
                        {isMine ? (
                          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button
                              onClick={() => handleFulfillRequest(req.id)}
                              style={{
                                flex: 1,
                                padding: '0.45rem 0.75rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                color: 'var(--brandgreen)',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-display)',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="fa-solid fa-check" style={{ marginRight: '0.25rem' }} /> Mark Found
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              style={{
                                padding: '0.45rem 0.65rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                              title="Delete Request"
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleIHaveThis(req)}
                            style={{
                              width: '100%',
                              backgroundColor: 'var(--brandblue)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '0.6rem 1rem',
                              fontSize: '0.85rem',
                              fontFamily: 'var(--font-display)',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              boxShadow: 'var(--shadow-blue)'
                            }}
                          >
                            <i className="fa-regular fa-comment-dots" />
                            I Have This (Chat Now)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
          onEditListing={(item) => {
            setSelectedListing(null);
            setEditingListing(item);
          }}
          onMessageSeller={(targetListing) => {
            setSelectedListing(null);
            handleOpenChat(targetListing);
          }}
          onRequireAuth={() => {
            setSelectedListing(null);
            setAuthPromptMessage('Message Seller');
            setShowAuthPrompt(true);
          }}
          currentUserId={currentUserId}
        />
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal 
          isOpen={!!editingListing}
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onUpdated={() => {
            setEditingListing(null);
            fetchListings();
          }}
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

      {/* Create Request Modal (Wanted Board) */}
      <CreateRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onCreated={() => {
          fetchRequests();
        }}
      />

      {/* Friendly Guest Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="modal-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--lightblue)', color: 'var(--brandblue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.25rem auto' }}>
              <i className="fa-solid fa-comments" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              {authPromptMessage}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Log in or create a free student account to chat with peers, negotiate securely, or post listings on your campus.
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
