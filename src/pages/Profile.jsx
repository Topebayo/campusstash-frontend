import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { apiFetch, getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import EditListingModal from '../components/EditListingModal';
import CreateListingModal from '../components/CreateListingModal';
import SettingsModal from '../components/SettingsModal';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import ItemDetailModal from '../components/ItemDetailModal';
import SellerStorefrontModal from '../components/SellerStorefrontModal';

const STORE_CATEGORIES = [
  'Fashion & Thrift',
  'Phones, Gadgets & Tech',
  'Food, Snacks & Pastries',
  'Beauty, Hair & Skincare',
  'Textbooks & Academics',
  'Hostel & Dorm Essentials',
  'Services, Printing & Repairs',
  'General Variety Store'
];

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('user'));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  // Active tab: 'listings' (My Active Listings) vs 'saved' (My Saved)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'saved' ? 'saved' : 'listings';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'saved') {
      setActiveTab('saved');
    } else if (params.get('tab') === 'listings') {
      setActiveTab('listings');
    }
  }, [location.search]);

  // Modals
  const [editingListing, setEditingListing] = useState(null);
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Store Management & Storefront Modals
  const [showStorefrontModal, setShowStorefrontModal] = useState(false);
  const [showStoreManagerModal, setShowStoreManagerModal] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeFormError, setStoreFormError] = useState('');
  const [storeForm, setStoreForm] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const u = saved ? JSON.parse(saved) : null;
      return {
        account_type: u?.account_type || 'individual',
        business_name: u?.business_name || '',
        business_category: u?.business_category || 'Fashion & Thrift',
        business_description: u?.business_description || '',
        business_address: u?.business_address || '',
        business_whatsapp: u?.business_whatsapp || '',
        business_instagram: u?.business_instagram || ''
      };
    } catch (e) {
      return {
        account_type: 'individual',
        business_name: '',
        business_category: 'Fashion & Thrift',
        business_description: '',
        business_address: '',
        business_whatsapp: '',
        business_instagram: ''
      };
    }
  });

  const fetchProfile = async () => {
    setLoadError('');
    try {
      const data = await apiFetch('/users/me');
      setProfile(data);
      if (data) {
        localStorage.setItem('user', JSON.stringify(data));
        setStoreForm({
          account_type: data.account_type || 'individual',
          business_name: data.business_name || '',
          business_category: data.business_category || 'Fashion & Thrift',
          business_description: data.business_description || '',
          business_address: data.business_address || '',
          business_whatsapp: data.business_whatsapp || '',
          business_instagram: data.business_instagram || ''
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setLoadError(err.message || 'Failed to load profile data.');
      if (err.message?.includes('credentials') || err.message?.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const data = await apiFetch('/listings/me');
      setMyListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load my listings:", err);
    }
  };

  const fetchSavedListings = async () => {
    const savedIds = JSON.parse(localStorage.getItem('saved_listings') || '[]');
    if (savedIds.length === 0) {
      setSavedListings([]);
      return;
    }

    // INSTANT DISPLAY: Load from session cache
    const cached = sessionStorage.getItem('cs_cached_saved_items');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedListings(parsed);
        }
      } catch (e) {}
    }

    try {
      const data = await apiFetch(`/listings/?ids=${savedIds.join(',')}&limit=100`);
      const allItems = data?.items || (Array.isArray(data) ? data : []);
      setSavedListings(allItems);
      try {
        sessionStorage.setItem('cs_cached_saved_items', JSON.stringify(allItems));
      } catch (e) {}
    } catch (err) {
      console.warn("Failed to fetch saved listings in profile:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchMyListings();
    fetchSavedListings();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'saved') {
      setActiveTab('saved');
    }
  }, [location.search]);

  const handleToggleStatus = async (listingId, currentStatus) => {
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
    try {
      const updated = await apiFetch(`/listings/${listingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setMyListings(prev => prev.map(item => item.id === listingId ? { ...item, status: updated.status, is_active: updated.is_active } : item));
    } catch (err) {
      alert(err.message || 'Failed to update listing status.');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    try {
      await apiFetch(`/listings/${listingId}`, {
        method: 'DELETE'
      });
      setMyListings(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      alert(err.message || 'Failed to delete listing.');
    }
  };

  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();
    setStoreFormError('');
    if (!storeForm.business_name || !storeForm.business_name.trim()) {
      setStoreFormError('Business / Store Name is required.');
      return;
    }
    setIsSavingStore(true);
    try {
      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          account_type: 'store',
          business_name: storeForm.business_name.trim(),
          business_category: storeForm.business_category,
          business_description: storeForm.business_description ? storeForm.business_description.trim() : '',
          business_address: storeForm.business_address ? storeForm.business_address.trim() : '',
          business_whatsapp: storeForm.business_whatsapp ? storeForm.business_whatsapp.trim() : '',
          business_instagram: storeForm.business_instagram ? storeForm.business_instagram.trim() : ''
        })
      });
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setShowStoreManagerModal(false);
    } catch (err) {
      console.error('Failed to update store:', err);
      setStoreFormError(err.message || 'Failed to save store profile.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const isStore = profile?.account_type === 'store';

  const displayName = profile?.profile?.burner_handle 
    ? `@${profile.profile.burner_handle}`
    : (profile?.full_name || profile?.email?.split('@')[0] || (isLoading ? 'Loading...' : 'Student'));

  const campusMajor = profile?.campus_name 
    ? `${profile.campus_name}${profile.major ? ` • ${profile.major}` : ''}`
    : (profile?.campus_acronym || 'Campus Student');

  const userBio = profile?.bio || 'Verified student on CampusStash.';
  
  const soldCount = myListings.filter(l => l.status === 'sold').length;
  const activeCount = myListings.filter(l => l.status !== 'sold').length;

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        onPrimaryAction={() => setIsCreateOpen(true)}
        primaryActionText="Sell an Item"
      />

      <main 
        className="animate-fade-in"
        style={{ 
          maxWidth: '860px', 
          margin: '0 auto', 
          width: '100%', 
          padding: Capacitor.isNativePlatform() ? '0.5rem 1.15rem 7rem 1.15rem' : '0.5rem 1.15rem 2.5rem 1.15rem', 
          boxSizing: 'border-box', 
          flex: 1 
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: EDITORIAL TITLE & GEAR ICON                            */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          padding: '0 0.25rem'
        }}>
          <div style={{ width: '36px' }} /> {/* Spacer */}

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.65rem',
            fontWeight: '600',
            color: 'var(--text-main)',
            margin: 0
          }}>
            Profile
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ThemeToggleBtn />
            <button
              onClick={() => setIsSettingsOpen(true)}
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
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-sm)'
              }}
              title="Settings & Security"
            >
              <i className="fa-solid fa-gear" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* USER PROFILE CARD (CENTERED AVATAR & STATS)                     */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '26px',
          padding: '1.75rem 1.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          {/* Centered Circular Avatar */}
          <div style={{
            position: 'relative',
            width: '92px',
            height: '92px',
            margin: '0 auto 1rem auto'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              border: '3px solid var(--border)',
              boxShadow: '0 4px 16px rgba(120, 95, 75, 0.14)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--terracotta)',
              fontSize: '2rem',
              fontWeight: '700'
            }}>
              {profile?.avatar_url ? (
                <img 
                  src={getImageUrl(profile.avatar_url)} 
                  alt={displayName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                displayName.replace('@', '').charAt(0).toUpperCase()
              )}
            </div>

            {/* Verified / Store Badge Pill */}
            {profile && (
              <div style={{
                position: 'absolute',
                bottom: '0px',
                right: '-10px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: '700',
                color: isStore ? 'var(--terracotta)' : '#2E7D32',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <i className={isStore ? "fa-solid fa-store" : "fa-solid fa-circle-check"} />
                {isStore ? 'Campus Store' : 'Verified'}
              </div>
            )}
          </div>

          {/* User Full Name / Handle or Business Name */}
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.35rem',
            fontWeight: '700',
            color: 'var(--text-main)',
            margin: '0 0 0.25rem 0'
          }}>
            {isStore && profile?.business_name ? profile.business_name : displayName}
          </h2>

          {/* Owner Credit & Category (for Stores) */}
          {isStore && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Owned by <strong style={{ color: 'var(--text-main)' }}>{profile?.name || displayName}</strong>
              </span>
              {profile?.business_category && (
                <span style={{
                  backgroundColor: 'var(--surface-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '0.74rem',
                  fontWeight: '600',
                  color: 'var(--terracotta)'
                }}>
                  🏷️ {profile.business_category}
                </span>
              )}
            </div>
          )}

          {/* Subtitle: Campus • Major or Pickup Spot */}
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0 0 0.75rem 0'
          }}>
            {campusMajor}
            {isStore && profile?.business_address ? ` • 📍 ${profile.business_address}` : ''}
          </p>

          {/* User Bio or Business Description */}
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-main)',
            lineHeight: 1.45,
            maxWidth: '420px',
            margin: '0 auto 1.1rem auto',
            opacity: 0.9
          }}>
            {isStore && profile?.business_description ? profile.business_description : userBio}
          </p>

          {/* Social Stats Row */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '9999px',
            padding: '0.35rem 1rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--text-main)'
          }}>
            <span>★ {profile?.rating ? profile.rating.toFixed(1) : '0.0'} ({profile?.reviews_count || 0} reviews)</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{soldCount} Items Sold</span>
          </div>

          {/* Store Actions or Upgrade to Store Banner */}
          {isStore ? (
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowStorefrontModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.55rem 1.15rem',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <i className="fa-solid fa-store" /> View Public Storefront
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoreForm({
                    account_type: profile?.account_type || 'store',
                    business_name: profile?.business_name || '',
                    business_category: profile?.business_category || 'Fashion & Thrift',
                    business_description: profile?.business_description || '',
                    business_address: profile?.business_address || '',
                    business_whatsapp: profile?.business_whatsapp || '',
                    business_instagram: profile?.business_instagram || ''
                  });
                  setShowStoreManagerModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '9999px',
                  padding: '0.55rem 1.15rem',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-pen-to-square" /> Edit Store Profile
              </button>
            </div>
          ) : (!isLoading && profile) ? (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: '16px',
              backgroundColor: 'var(--surface-alt)',
              border: '1px dashed var(--terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fa-solid fa-store" style={{ color: 'var(--terracotta)' }} />
                  Running a Student Business?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upgrade to a Campus Store to brand your shopfront, showcase items, and chat directly with campus buyers!
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStoreForm({
                    account_type: 'store',
                    business_name: '',
                    business_category: 'Fashion & Thrift',
                    business_description: '',
                    business_address: '',
                    business_instagram: ''
                  });
                  setShowStoreManagerModal(true);
                }}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--terracotta)',
                  color: '#FFFFFF',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Upgrade to Store
              </button>
            </div>
          ) : null}
        </div>

        {/* ============================================================== */}
        {/* SEGMENTED PILL SWITCHER: ACTIVE LISTINGS vs SAVED              */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--surface-alt)',
          borderRadius: '9999px',
          padding: '4px',
          marginBottom: '1.25rem',
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'listings' ? 'var(--terracotta)' : 'transparent',
              color: activeTab === 'listings' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'listings' ? '0 2px 8px rgba(200, 122, 91, 0.3)' : 'none'
            }}
          >
            My Active Listings ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'saved' ? 'var(--terracotta)' : 'transparent',
              color: activeTab === 'saved' ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'saved' ? '0 2px 8px rgba(200, 122, 91, 0.3)' : 'none'
            }}
          >
            My Saved ({savedListings.length})
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MY ACTIVE LISTINGS (2-COLUMN GRID)                       */}
        {/* ============================================================== */}
        {activeTab === 'listings' && (
          <div>
            {myListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)'
              }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', color: 'var(--terracotta)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                  No Listings Posted Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Declutter your dorm! Post textbooks, calculator, or gear in under a minute.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => setIsCreateOpen(true)}
                  style={{ borderRadius: '9999px', padding: '0.65rem 1.4rem' }}
                >
                  <i className="fa-solid fa-plus" /> Post Your First Item
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                {myListings.map(listing => {
                  const isSold = listing.status === 'sold';
                  const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
                  const priceFormatted = rawPrice.toLocaleString();

                  return (
                    <div 
                      key={listing.id}
                      className="aesthetic-card"
                      style={{ opacity: isSold ? 0.75 : 1 }}
                    >
                      {/* Image Box */}
                      <div 
                        className="aesthetic-card-image-box"
                        onClick={() => setSelectedDetailListing(listing)}
                      >
                        {listing.image_url ? (
                          <img 
                            src={getImageUrl(listing.image_url)} 
                            alt={listing.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '1.75rem' }}>
                            <i className="fa-regular fa-image" />
                          </div>
                        )}

                        {/* Status Pill */}
                        <div className={`aesthetic-card-status-pill ${isSold ? 'sold' : 'active'}`} style={{ bottom: 'auto', top: '10px' }}>
                          <span className={`aesthetic-status-dot ${isSold ? 'sold' : 'active'}`} />
                          <span>{isSold ? 'Sold' : 'Active'}</span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="aesthetic-card-details">
                        <h4 
                          className="aesthetic-card-title"
                          onClick={() => setSelectedDetailListing(listing)}
                        >
                          {listing.title}
                        </h4>
                        <div className="aesthetic-card-price">
                          ₦{priceFormatted}
                        </div>

                        {/* Action Buttons for Seller */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => setEditingListing(listing)}
                            style={{
                              flex: 1,
                              padding: '4px',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface-alt)',
                              color: 'var(--text-main)',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            <i className="fa-solid fa-pen" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(listing.id, listing.status)}
                            style={{
                              flex: 1,
                              padding: '4px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: isSold ? '#2E7D32' : 'var(--terracotta)',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {isSold ? 'Activate' : 'Sold'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MY SAVED ITEMS (2-COLUMN GRID)                           */}
        {/* ============================================================== */}
        {activeTab === 'saved' && (
          <div>
            {savedListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)'
              }}>
                <i className="fa-regular fa-bookmark" style={{ fontSize: '2rem', color: 'var(--terracotta)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                  No Saved Items Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Tap the heart icon on any listing to save it here for quick access later.
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                {savedListings.map(listing => {
                  const rawPrice = listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0);
                  const priceFormatted = rawPrice.toLocaleString();

                  return (
                    <div 
                      key={listing.id}
                      className="aesthetic-card"
                      onClick={() => setSelectedDetailListing(listing)}
                    >
                      <div className="aesthetic-card-image-box">
                        {listing.image_url ? (
                          <img 
                            src={getImageUrl(listing.image_url)} 
                            alt={listing.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '1.75rem' }}>
                            <i className="fa-regular fa-image" />
                          </div>
                        )}
                        <div className="aesthetic-card-seller-pill">
                          <span>{listing.campus_acronym || 'Campus'}</span>
                        </div>
                      </div>

                      <div className="aesthetic-card-details">
                        <h4 className="aesthetic-card-title">
                          {listing.title}
                        </h4>
                        <div className="aesthetic-card-price">
                          ₦{priceFormatted}
                        </div>
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
      {selectedDetailListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedDetailListing}
          onClose={() => setSelectedDetailListing(null)}
          onMessageSeller={(item) => navigate('/dashboard')}
          currentUserId={profile?.id}
          onEditListing={(item) => {
            setSelectedDetailListing(null);
            setEditingListing(item);
          }}
          onToggleStatus={(id, st) => {
            handleToggleStatus(id, st);
            setSelectedDetailListing(null);
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
            fetchMyListings();
          }}
        />
      )}

      {/* Create Listing Modal */}
      {isCreateOpen && (
        <CreateListingModal 
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            fetchMyListings();
          }}
          onSuccess={() => {
            fetchMyListings();
          }}
          onCreated={() => {
            fetchMyListings();
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        }}
      />

      {/* Store Manager & Upgrade Modal */}
      {showStoreManagerModal && (
        <div className="modal-overlay" onClick={() => setShowStoreManagerModal(false)} style={{ zIndex: 1200 }}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '520px', 
              width: '92%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  {profile?.account_type === 'store' ? 'Edit Campus Store' : 'Upgrade to Campus Store'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Set your official campus business identity, contact details, and pickup spot
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreManagerModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {storeFormError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.84rem',
                marginBottom: '1rem',
                fontWeight: '600'
              }}>
                {storeFormError}
              </div>
            )}

            <form onSubmit={handleSaveStore} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Real Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={storeForm.business_name}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="e.g. Kev's Campus Thrifts"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Business Category
                </label>
                <select
                  className="form-input"
                  value={storeForm.business_category}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_category: e.target.value }))}
                  style={{ cursor: 'pointer' }}
                >
                  {STORE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Store Bio / Tagline (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={storeForm.business_description}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_description: e.target.value }))}
                  placeholder="e.g. Premium thrift fits & shoes. Daily hostel delivery."
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Hostel / Campus Pickup Spot (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_address}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_address: e.target.value }))}
                  placeholder="e.g. Achievers Hall Room B12 or Sub Car Park"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Instagram / Social Handle (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_instagram}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_instagram: e.target.value }))}
                  placeholder="e.g. @kevs_thrifts"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStoreManagerModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStore}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--terracotta)',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    cursor: 'pointer',
                    opacity: isSavingStore ? 0.7 : 1
                  }}
                >
                  {isSavingStore ? 'Saving...' : (profile?.account_type === 'store' ? 'Save Changes' : 'Activate Campus Store')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Storefront Modal (Previewing own store) */}
      {showStorefrontModal && (
        <SellerStorefrontModal
          isOpen={true}
          onClose={() => setShowStorefrontModal(false)}
          sellerId={profile?.id}
          sellerName={profile?.business_name || profile?.full_name || displayName}
          onMessageSeller={() => {
            setShowStorefrontModal(false);
          }}
        />
      )}
    </div>
  );
}

export default Profile;
