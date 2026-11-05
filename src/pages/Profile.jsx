import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, getImageUrl } from '../api';
import Navbar from '../components/Navbar';
import EditListingModal from '../components/EditListingModal';
import CreateListingModal from '../components/CreateListingModal';
import SettingsModal from '../components/SettingsModal';
import ThemeToggleBtn from '../components/ThemeToggleBtn';
import ItemDetailModal from '../components/ItemDetailModal';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Modals
  const [editingListing, setEditingListing] = useState(null);
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await apiFetch('/users/me');
      setProfile(data);
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
    try {
      const savedIds = JSON.parse(localStorage.getItem('saved_listings') || '[]');
      if (savedIds.length === 0) {
        setSavedListings([]);
        return;
      }
      const data = await apiFetch('/listings/');
      const allItems = Array.isArray(data) ? data : (data?.items || []);
      const matched = allItems.filter(item => savedIds.includes(item.id));
      setSavedListings(matched);
    } catch (err) {
      console.warn("Failed to fetch saved listings:", err);
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
          maxWidth: '520px', 
          margin: '0 auto', 
          width: '100%', 
          padding: '0.5rem 1.15rem 7rem 1.15rem', 
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

            {/* Verified Badge Pill */}
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
              color: '#2E7D32',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>
              <i className="fa-solid fa-circle-check" /> Verified
            </div>
          </div>

          {/* User Full Name / Handle */}
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.35rem',
            fontWeight: '700',
            color: 'var(--text-main)',
            margin: '0 0 0.25rem 0'
          }}>
            {displayName}
          </h2>

          {/* Subtitle: Campus • Major */}
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0 0 0.75rem 0'
          }}>
            {campusMajor}
          </p>

          {/* User Bio */}
          <p style={{
            fontSize: '0.88rem',
            color: '#44403C',
            lineHeight: 1.45,
            maxWidth: '360px',
            margin: '0 auto 1.1rem auto'
          }}>
            {userBio}
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
            <span>★ 4.9 (12 reviews)</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{soldCount} Items Sold</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SEGMENTED PILL SWITCHER: ACTIVE LISTINGS vs SAVED              */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          backgroundColor: '#F4EFEB',
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

                        {/* Top-Left Pill */}
                        <div className="aesthetic-card-seller-pill">
                          <span style={{ color: isSold ? '#ef4444' : '#2E7D32' }}>
                            {isSold ? 'Sold' : 'Active'}
                          </span>
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
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
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
    </div>
  );
}

export default Profile;
