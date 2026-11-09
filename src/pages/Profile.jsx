import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { apiFetch, getImageUrl, getCampuses, DEFAULT_CAMPUSES, setActiveCampusId, getActiveCampusId } from '../api';
import Navbar from '../components/Navbar';
import CampusOnboardingModal from '../components/CampusOnboardingModal';
import EditListingModal from '../components/EditListingModal';
import CreateListingModal from '../components/CreateListingModal';
import SettingsModal from '../components/SettingsModal';
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

  // Active view: 'menu' | 'listings' | 'saved'
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'saved') return 'saved';
    if (params.get('tab') === 'listings') return 'listings';
    return 'menu';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'saved') {
      setActiveSection('saved');
    } else if (params.get('tab') === 'listings') {
      setActiveSection('listings');
    }
  }, [location.search]);

  // Modals
  const [editingListing, setEditingListing] = useState(null);
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [campuses, setCampuses] = useState(() => {
    try {
      const cached = localStorage.getItem('campusstash_cached_campuses');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUSES;
    } catch (e) {
      return DEFAULT_CAMPUSES;
    }
  });

  useEffect(() => {
    getCampuses().then(data => {
      if (Array.isArray(data) && data.length > 0) setCampuses(data);
    }).catch(() => {});
  }, []);

  const handleProfileChangeCampus = async (newCampusId) => {
    setShowCampusModal(false);
    if (!newCampusId) return;
    setActiveCampusId(newCampusId);
    try {
      const updated = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ campus_id: newCampusId })
      });
      const cur = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = { ...cur, ...(updated || {}), campus_id: newCampusId };
      localStorage.setItem('user', JSON.stringify(merged));
      setProfile(merged);
    } catch (e) {
      setProfile(prev => ({ ...prev, campus_id: newCampusId }));
    }
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('account');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Store Management & Storefront Modals
  const [showStorefrontModal, setShowStorefrontModal] = useState(false);
  const [showStoreKycModal, setShowStoreKycModal] = useState(false);
  const [isSavingStoreKyc, setIsSavingStoreKyc] = useState(false);
  const [storeKycError, setStoreKycError] = useState('');
  const [idCardPreview, setIdCardPreview] = useState(null);
  const idCardInputRef = useRef(null);

  const [storeForm, setStoreForm] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const u = saved ? JSON.parse(saved) : null;
      return {
        business_name: u?.business_name || '',
        business_category: u?.business_category || 'Fashion & Thrift',
        student_id_number: u?.kyc_student_id || '',
        business_description: u?.business_description || '',
        business_address: u?.business_address || '',
        business_whatsapp: u?.business_whatsapp || '',
        business_instagram: u?.business_instagram || '',
        id_card_image: u?.kyc_id_card_url || null
      };
    } catch (e) {
      return {
        business_name: '',
        business_category: 'Fashion & Thrift',
        student_id_number: '',
        business_description: '',
        business_address: '',
        business_whatsapp: '',
        business_instagram: '',
        id_card_image: null
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
          business_name: data.business_name || '',
          business_category: data.business_category || 'Fashion & Thrift',
          student_id_number: data.kyc_student_id || '',
          business_description: data.business_description || '',
          business_address: data.business_address || '',
          business_whatsapp: data.business_whatsapp || '',
          business_instagram: data.business_instagram || '',
          id_card_image: data.kyc_id_card_url || null
        });
        if (data.kyc_id_card_url) {
          setIdCardPreview(data.kyc_id_card_url);
        }
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

  const handleIdCardFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target.result;
        setIdCardPreview(base64);
        setStoreForm(prev => ({ ...prev, id_card_image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStoreKyc = async (e) => {
    if (e) e.preventDefault();
    setStoreKycError('');

    if (!storeForm.business_name || !storeForm.business_name.trim()) {
      setStoreKycError('Real Business / Store Name is required.');
      return;
    }
    if (!storeForm.student_id_number || !storeForm.student_id_number.trim()) {
      setStoreKycError('Student Matriculation / Student ID Number is required for KYC.');
      return;
    }

    setIsSavingStoreKyc(true);
    try {
      const updated = await apiFetch('/users/me/store-kyc', {
        method: 'POST',
        body: JSON.stringify({
          business_name: storeForm.business_name.trim(),
          business_category: storeForm.business_category,
          student_id_number: storeForm.student_id_number.trim(),
          business_description: storeForm.business_description ? storeForm.business_description.trim() : '',
          business_address: storeForm.business_address ? storeForm.business_address.trim() : '',
          business_whatsapp: storeForm.business_whatsapp ? storeForm.business_whatsapp.trim() : '',
          business_instagram: storeForm.business_instagram ? storeForm.business_instagram.trim() : '',
          id_card_image: storeForm.id_card_image || null
        })
      });
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setShowStoreKycModal(false);
    } catch (err) {
      console.error('Failed to submit store KYC:', err);
      setStoreKycError(err.message || 'Failed to submit store KYC verification.');
    } finally {
      setIsSavingStoreKyc(false);
    }
  };

  const isStore = profile?.account_type === 'store';
  const isKycVerified = profile?.kyc_status === 'verified';

  const displayName = profile?.profile?.burner_handle 
    ? `@${profile.profile.burner_handle}`
    : (profile?.name || profile?.email?.split('@')[0] || (isLoading ? 'Loading...' : 'Student'));

  const activeCampusObj = campuses.find(c => c.id === (profile?.campus_id || getActiveCampusId()));
  const campusLocation = activeCampusObj?.name 
    ? `${activeCampusObj.name}${profile?.business_address ? ` • ${profile.business_address}` : ''}`
    : (profile?.campus_name || profile?.campus_acronym || 'Lead City University');

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
          padding: Capacitor.isNativePlatform() ? '0.75rem 1rem 7.5rem 1rem' : '0.75rem 1rem 3.5rem 1rem', 
          boxSizing: 'border-box', 
          flex: 1 
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: BACK ARROW + SETTINGS BUTTON (RIGHT SCREEN IN MOCKUP) */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          padding: '0 0.25rem'
        }}>
          <button
            type="button"
            onClick={() => {
              if (activeSection !== 'menu') {
                setActiveSection('menu');
              } else {
                navigate(-1);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Go Back"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>

          <button
            type="button"
            onClick={() => {
              setSettingsDefaultTab('account');
              setIsSettingsOpen(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '6px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--surface)'
            }}
          >
            <i className="fa-solid fa-gear" />
            <span>Settings</span>
          </button>
        </div>

        {/* PROFILE TITLE */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.65rem',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
          margin: '0 0 1.25rem 0.25rem'
        }}>
          Profile
        </h1>

        {/* ============================================================== */}
        {/* FLOATING USER IDENTITY CARD (SHOPMATE TEMPLATE FIDELITY)       */}
        {/* ============================================================== */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '26px',
          padding: '1.75rem 1.25rem 1.5rem 1.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
          marginBottom: '1.25rem',
          position: 'relative'
        }}>
          {/* Circular Avatar with Green Border and Verified Badge */}
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
              border: '3px solid #10B981',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.22)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              fontSize: '2rem',
              fontWeight: '800'
            }}>
              {profile?.avatar_url || profile?.profile?.avatar_slug ? (
                <img 
                  src={getImageUrl(profile.avatar_url || profile.profile.avatar_slug)} 
                  alt={displayName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                displayName.replace('@', '').charAt(0).toUpperCase()
              )}
            </div>

            {/* Attached Verified Badge Pill */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '2px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.68rem',
              fontWeight: '800',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              whiteSpace: 'nowrap'
            }}>
              <i className="fa-solid fa-check" style={{ fontSize: '0.62rem' }} />
              <span>{isStore ? (isKycVerified ? 'Verified Store' : 'Store KYC') : 'Verified'}</span>
            </div>
          </div>

          {/* User Full Name / Business Name */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.35rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-main)',
            margin: '0 0 0.35rem 0'
          }}>
            {isStore && profile?.business_name ? profile.business_name : (profile?.name || displayName)}
          </h2>

          {/* Location Pin & Campus Switcher */}
          <div 
            onClick={() => setShowCampusModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              transition: 'all 0.15s ease'
            }}
            title="Click to change your university"
          >
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', fontSize: '0.82rem' }} />
            <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{campusLocation}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.62rem', opacity: 0.65 }} />
          </div>

          {/* Edit Profile Pill Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSettingsDefaultTab('account');
                setIsSettingsOpen(true);
              }}
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: '9999px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-alt)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUICK 3-CARD STATS ROW (MY LISTINGS / STORE KYC / SAVED)       */}
        {/* ============================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.65rem',
          marginBottom: '1.35rem'
        }}>
          {/* Card 1: My Listings */}
          <div 
            onClick={() => setActiveSection('listings')}
            style={{
              backgroundColor: 'var(--surface)',
              border: activeSection === 'listings' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '20px',
              padding: '0.9rem 0.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              margin: '0 auto 0.45rem auto'
            }}>
              <i className="fa-solid fa-box" />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
              My Listings
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeCount} active
            </div>
          </div>

          {/* Card 2: Store KYC / Merchant */}
          <div 
            onClick={() => {
              if (isStore) {
                setShowStorefrontModal(true);
              } else {
                setShowStoreKycModal(true);
              }
            }}
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '0.9rem 0.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: isKycVerified ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
              color: isKycVerified ? '#10B981' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              margin: '0 auto 0.45rem auto'
            }}>
              <i className="fa-solid fa-store" />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {isStore ? 'My Store' : 'Store KYC'}
            </div>
            <div style={{ fontSize: '0.72rem', color: isKycVerified ? '#10B981' : 'var(--text-muted)', marginTop: '2px', fontWeight: isKycVerified ? '700' : '500' }}>
              {isKycVerified ? 'Verified ✓' : (isStore ? 'Edit KYC' : 'Verify')}
            </div>
          </div>

          {/* Card 3: Total Saved */}
          <div 
            onClick={() => setActiveSection('saved')}
            style={{
              backgroundColor: 'var(--surface)',
              border: activeSection === 'saved' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '20px',
              padding: '0.9rem 0.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              margin: '0 auto 0.45rem auto'
            }}>
              <i className="fa-solid fa-heart" />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Total Saved
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {savedListings.length} items
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVIGATION MENU ITEMS WITH CHEVRONS (SHOPMATE TEMPLATE)        */}
        {/* ============================================================== */}
        {activeSection === 'menu' && (
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            padding: '0.4rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            {/* Row 1: My Listings & Sales */}
            <div
              onClick={() => setActiveSection('listings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.1rem',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-clock-rotate-left" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    My Listings & Sales
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '9999px' }}>
                  {myListings.length} items
                </span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Row 3: Store Owner Complete KYC */}
            <div
              onClick={() => setShowStoreKycModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.95rem 1.1rem',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.95rem', flexShrink: 0 }}>
                  <i className="fa-solid fa-id-card" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Store Owner KYC
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Student ID & Business credentials
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: isKycVerified ? '#10B981' : 'var(--primary)',
                  backgroundColor: isKycVerified ? 'rgba(16, 185, 129, 0.12)' : 'var(--primary-light)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: '1',
                  flexShrink: 0
                }}>
                  {isKycVerified ? 'Verified ✓' : 'Complete KYC'}
                </span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Row 4: Preferences & Theme */}
            <div
              onClick={() => {
                setSettingsDefaultTab('appearance');
                setIsSettingsOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.1rem',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-sliders" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Preferences & Dark Mode Sync
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
            </div>

            {/* Row 5: Help & Campus Safety Support */}
            <div
              onClick={() => {
                setSettingsDefaultTab('safety');
                setIsSettingsOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.1rem',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <i className="fa-regular fa-circle-question" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Help & Campus Safety Support
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MY LISTINGS SECTION (2-COLUMN GRID)                            */}
        {/* ============================================================== */}
        {activeSection === 'listings' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text-main)' }}>
                My Listings ({myListings.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                + Post New Item
              </button>
            </div>

            {myListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)'
              }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', color: 'var(--primary)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                  No Listings Posted Yet
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Post textbooks, dorm gear, or tech gadgets in seconds.
                </p>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  style={{
                    borderRadius: '9999px',
                    padding: '0.65rem 1.4rem',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa-solid fa-plus" /> Post First Item
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
                      className="shopmate-card"
                      style={{ opacity: isSold ? 0.72 : 1 }}
                    >
                      <div 
                        className="shopmate-card-image-box"
                        onClick={() => setSelectedDetailListing(listing)}
                      >
                        {listing.image_url ? (
                          <img 
                            src={getImageUrl(listing.image_url)} 
                            alt={listing.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.75rem' }}>
                            <i className="fa-regular fa-image" />
                          </div>
                        )}

                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: isSold ? 'rgba(30, 41, 59, 0.85)' : 'rgba(16, 185, 129, 0.92)',
                          color: '#FFFFFF',
                          borderRadius: '9999px',
                          padding: '2px 8px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isSold ? 'Sold' : 'Active'}
                        </div>
                      </div>

                      <div className="shopmate-card-body">
                        <h4 
                          className="shopmate-card-title"
                          onClick={() => setSelectedDetailListing(listing)}
                        >
                          {listing.title}
                        </h4>
                        <div className="shopmate-card-price">
                          ₦{priceFormatted}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setEditingListing(listing)}
                            style={{
                              flex: 1,
                              padding: '5px 0',
                              borderRadius: '9999px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface-alt)',
                              color: 'var(--text-main)',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(listing.id, listing.status)}
                            style={{
                              flex: 1,
                              padding: '5px 0',
                              borderRadius: '9999px',
                              border: 'none',
                              backgroundColor: isSold ? 'var(--primary)' : 'var(--surface-alt)',
                              color: isSold ? '#FFFFFF' : 'var(--text-main)',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {isSold ? 'Relist' : 'Sold'}
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
        {/* SAVED ITEMS SECTION (2-COLUMN GRID)                            */}
        {/* ============================================================== */}
        {activeSection === 'saved' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '0 0 0.85rem 0', color: 'var(--text-main)' }}>
              Saved Items ({savedListings.length})
            </h3>

            {savedListings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border)'
              }}>
                <i className="fa-regular fa-heart" style={{ fontSize: '2rem', color: 'var(--primary)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.3rem' }}>
                  No Saved Items Yet
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Tap the heart icon on any campus listing to bookmark items here.
                </p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{
                    borderRadius: '9999px',
                    padding: '0.65rem 1.4rem',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
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
                      className="shopmate-card"
                      onClick={() => setSelectedDetailListing(listing)}
                    >
                      <div className="shopmate-card-image-box">
                        {listing.image_url ? (
                          <img 
                            src={getImageUrl(listing.image_url)} 
                            alt={listing.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.75rem' }}>
                            <i className="fa-regular fa-image" />
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#EF4444',
                          fontSize: '0.85rem'
                        }}>
                          <i className="fa-solid fa-heart" />
                        </div>
                      </div>

                      <div className="shopmate-card-body">
                        <h4 className="shopmate-card-title">
                          {listing.title}
                        </h4>
                        <div className="shopmate-card-price">
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

        {/* LOG OUT BUTTON (CENTERED IN RED TEXT) */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/auth');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: '0.92rem',
              fontWeight: '800',
              cursor: 'pointer',
              padding: '0.5rem 1rem'
            }}
          >
            Log Out
          </button>
        </div>
      </main>

      {/* Item Detail Modal */}
      {selectedDetailListing && (
        <ItemDetailModal 
          isOpen={true}
          listing={selectedDetailListing}
          onClose={() => setSelectedDetailListing(null)}
          onMessageSeller={() => navigate('/dashboard')}
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
        defaultTab={settingsDefaultTab}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        }}
      />

      {/* Profile Campus Switcher Modal */}
      <CampusOnboardingModal
        isOpen={showCampusModal}
        campuses={campuses}
        currentCampusId={profile?.campus_id || getActiveCampusId()}
        onSelectCampus={handleProfileChangeCampus}
        onClose={() => setShowCampusModal(false)}
      />

      {/* ============================================================== */}
      {/* STORE OWNER COMPLETE KYC MODAL                                 */}
      {/* ============================================================== */}
      {showStoreKycModal && (
        <div className="modal-overlay" onClick={() => setShowStoreKycModal(false)} style={{ zIndex: 1200 }}>
          <div 
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '520px', 
              width: '92%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              borderRadius: '26px',
              padding: '1.75rem',
              backgroundColor: 'var(--surface)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Official Merchant Onboarding
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0.2rem 0 0 0' }}>
                  Store Owner Complete KYC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreKycModal(false)}
                style={{
                  background: 'var(--surface-alt)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {storeKycError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                fontSize: '0.84rem',
                marginBottom: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa-solid fa-circle-exclamation" />
                <span>{storeKycError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStoreKyc} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Official Store / Brand Name *
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
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Business Category *
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

              {/* Student Matriculation / Student ID */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', fontSize: '0.84rem' }}>
                    Student ID / Matriculation Number *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '800' }}>
                    KYC Required
                  </span>
                </div>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={storeForm.student_id_number}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, student_id_number: e.target.value }))}
                  placeholder="e.g. LCU/22/10452 or UI/21/9831"
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Used to verify active student enrollment for your campus merchant badge.
                </span>
              </div>

              {/* Student ID Card Photo Upload */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Upload Student ID Card Photo
                </label>
                <input
                  type="file"
                  ref={idCardInputRef}
                  accept="image/*"
                  onChange={handleIdCardFile}
                  style={{ display: 'none' }}
                />

                {idCardPreview ? (
                  <div style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    height: '140px',
                    backgroundColor: 'var(--surface-alt)'
                  }}>
                    <img 
                      src={idCardPreview} 
                      alt="Student ID Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIdCardPreview(null);
                        setStoreForm(prev => ({ ...prev, id_card_image: null }));
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => idCardInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--primary)',
                      borderRadius: '16px',
                      padding: '1.2rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--surface-alt)',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-camera" style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '0.35rem' }} />
                    <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Tap to Upload Student ID Card Photo
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      School ID card or student portal screenshot
                    </div>
                  </div>
                )}
              </div>

              {/* Campus Pickup Spot */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Hostel / Campus Pickup Spot
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_address}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_address: e.target.value }))}
                  placeholder="e.g. SUB Car Park or Peace Hall Room B12"
                />
              </div>

              {/* WhatsApp Contact */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Business WhatsApp Contact
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={storeForm.business_whatsapp}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_whatsapp: e.target.value }))}
                  placeholder="e.g. 08012345678"
                />
              </div>

              {/* Instagram Handle */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Store Instagram Handle (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_instagram}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_instagram: e.target.value }))}
                  placeholder="e.g. @kevs_thrifts"
                />
              </div>

              {/* Store Tagline */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.84rem', display: 'block', marginBottom: '0.35rem' }}>
                  Store Bio / Tagline (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={storeForm.business_description}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_description: e.target.value }))}
                  placeholder="e.g. Daily hostel deliveries for thrift fits, kicks, and phone accessories."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStoreKycModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStoreKyc}
                  style={{
                    flex: 2,
                    padding: '0.8rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    opacity: isSavingStoreKyc ? 0.7 : 1,
                    boxShadow: '0 4px 14px var(--primary-light)'
                  }}
                >
                  {isSavingStoreKyc ? 'Submitting KYC...' : 'Submit & Complete KYC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seller Storefront Modal */}
      {showStorefrontModal && (
        <SellerStorefrontModal
          isOpen={true}
          onClose={() => setShowStorefrontModal(false)}
          sellerId={profile?.id}
          sellerName={profile?.business_name || profile?.name || displayName}
          onMessageSeller={() => {
            setShowStorefrontModal(false);
          }}
        />
      )}
    </div>
  );
}

export default Profile;
