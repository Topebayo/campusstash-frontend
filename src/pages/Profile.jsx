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

const GOVERNMENT_ID_TYPES = [
  { id: 'nin', name: 'National Identification Number (NIN)', placeholder: 'e.g. 11-digit NIN (e.g. 12345678901)' },
  { id: 'voters_card', name: "Voter's Card (INEC PVC)", placeholder: 'e.g. 19-digit VIN code on your voter card' },
  { id: 'drivers_license', name: "Driver's License (FRSC)", placeholder: 'e.g. Driving License Number' },
  { id: 'passport', name: 'International Passport', placeholder: 'e.g. Passport Booklet No. (A12345678)' },
  { id: 'national_id', name: 'Other Government / State Issued ID', placeholder: 'e.g. Official Government ID No.' }
];

// High-speed client-side image compression to prevent mobile upload timeouts and 413 payload errors
const compressImage = (file, maxWidth = 900, maxHeight = 900, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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
  const [kycUserType, setKycUserType] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const u = saved ? JSON.parse(saved) : null;
      return u?.kyc_user_type || 'student';
    } catch (e) {
      return 'student';
    }
  });
  const [idCardPreview, setIdCardPreview] = useState(null);
  const idCardInputRef = useRef(null);

  // Biometric Face Verification state
  const [selfiePreview, setSelfiePreview] = useState(null);
  const selfieCameraInputRef = useRef(null);
  const selfieGalleryInputRef = useRef(null);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [cameraStreamActive, setCameraStreamActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Customer & Campus Support state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTopic, setSupportTopic] = useState('General Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCopied, setSupportCopied] = useState(false);

  const [storeForm, setStoreForm] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const u = saved ? JSON.parse(saved) : null;
      return {
        business_name: u?.business_name || '',
        business_category: u?.business_category || 'Fashion & Thrift',
        student_id_number: u?.kyc_student_id || '',
        id_type: u?.kyc_id_type || 'nin',
        id_number: u?.kyc_id_number || '',
        business_description: u?.business_description || '',
        business_address: u?.business_address || '',
        business_whatsapp: u?.business_whatsapp || '',
        business_instagram: u?.business_instagram || '',
        id_card_image: u?.kyc_id_card_url || null,
        face_selfie_image: u?.kyc_selfie_url || null
      };
    } catch (e) {
      return {
        business_name: '',
        business_category: 'Fashion & Thrift',
        student_id_number: '',
        id_type: 'nin',
        id_number: '',
        business_description: '',
        business_address: '',
        business_whatsapp: '',
        business_instagram: '',
        id_card_image: null,
        face_selfie_image: null
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
        if (data.kyc_user_type) {
          setKycUserType(data.kyc_user_type);
        }
        setStoreForm({
          business_name: data.business_name || '',
          business_category: data.business_category || 'Fashion & Thrift',
          student_id_number: data.kyc_student_id || '',
          id_type: data.kyc_id_type || 'nin',
          id_number: data.kyc_id_number || '',
          business_description: data.business_description || '',
          business_address: data.business_address || '',
          business_whatsapp: data.business_whatsapp || '',
          business_instagram: data.business_instagram || '',
          id_card_image: data.kyc_id_card_url || null,
          face_selfie_image: data.kyc_selfie_url || null
        });
        if (data.kyc_id_card_url) {
          setIdCardPreview(data.kyc_id_card_url);
        }
        if (data.kyc_selfie_url) {
          setSelfiePreview(data.kyc_selfie_url);
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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Connect live camera to video element
  useEffect(() => {
    if (cameraStreamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Camera video play error:', e));
    }
  }, [cameraStreamActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraStreamActive(false);
  };

  const startCamera = async () => {
    // If running on mobile or camera stream is unavailable, trigger native camera immediately
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      selfieCameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraStreamActive(true);
    } catch (err) {
      console.warn('Live camera stream unavailable, opening native camera:', err);
      selfieCameraInputRef.current?.click();
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.82);

    stopCamera();
    setIsFaceScanning(true);
    setTimeout(() => {
      setSelfiePreview(base64);
      setStoreForm(prev => ({ ...prev, face_selfie_image: base64 }));
      setIsFaceScanning(false);
    }, 700);
  };

  const handleSelfieFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreKycError('');
      setIsFaceScanning(true);
      try {
        const compressed = await compressImage(file, 640, 640, 0.82);
        setTimeout(() => {
          setSelfiePreview(compressed);
          setStoreForm(prev => ({ ...prev, face_selfie_image: compressed }));
          setIsFaceScanning(false);
        }, 700);
      } catch (err) {
        setIsFaceScanning(false);
        console.error('Selfie processing error:', err);
        setStoreKycError('Could not process selfie photo. Please try again.');
      }
      // Reset input value so same photo can be re-selected if retrying
      if (e.target) e.target.value = '';
    }
  };

  const handleIdCardFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreKycError('');
      try {
        const compressed = await compressImage(file, 900, 900, 0.8);
        setIdCardPreview(compressed);
        setStoreForm(prev => ({ ...prev, id_card_image: compressed }));
      } catch (err) {
        console.error('ID Card processing error:', err);
        setStoreKycError('Could not process ID document image. Please try again.');
      }
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveStoreKyc = async (e) => {
    if (e) e.preventDefault();
    setStoreKycError('');

    const bName = String(storeForm.business_name || '').trim();
    if (!bName) {
      setStoreKycError('Official Store / Brand Name is required.');
      return;
    }

    if (kycUserType === 'non_student') {
      const idNum = String(storeForm.id_number || '').trim();
      if (!idNum) {
        const idLabel = GOVERNMENT_ID_TYPES.find(t => t.id === storeForm.id_type)?.name || 'Government ID';
        setStoreKycError(`${idLabel} Number is required for outsider verification.`);
        return;
      }
      if (!storeForm.id_card_image) {
        setStoreKycError('Please upload a clear photo of your Government ID document/slip.');
        return;
      }
      if (!storeForm.face_selfie_image) {
        setStoreKycError('Biometric Face Verification selfie is required for outsider verification.');
        return;
      }
    } else {
      const studentId = String(storeForm.student_id_number || '').trim();
      if (!studentId) {
        setStoreKycError('Student Matriculation / Student ID Number is required for student KYC.');
        return;
      }
    }

    setIsSavingStoreKyc(true);
    try {
      const payload = {
        business_name: bName,
        business_category: storeForm.business_category || 'General Variety Store',
        user_type: kycUserType,
        student_id_number: kycUserType === 'student' ? String(storeForm.student_id_number || '').trim() : null,
        id_type: kycUserType === 'non_student' ? (storeForm.id_type || 'nin') : 'student_id',
        id_number: kycUserType === 'non_student' ? String(storeForm.id_number || '').trim() : (String(storeForm.student_id_number || '').trim() || null),
        business_description: String(storeForm.business_description || '').trim(),
        business_address: String(storeForm.business_address || '').trim(),
        business_whatsapp: String(storeForm.business_whatsapp || '').trim(),
        business_instagram: String(storeForm.business_instagram || '').trim().replace(/^@/, ''),
        id_card_image: storeForm.id_card_image || null,
        face_selfie_image: storeForm.face_selfie_image || null
      };

      const updated = await apiFetch('/users/me/store-kyc', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setShowStoreKycModal(false);
      stopCamera();
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
              <span>{isStore ? (isKycVerified ? (profile?.kyc_user_type === 'non_student' ? 'Verified Partner' : 'Verified Store') : 'Store KYC') : 'Verified'}</span>
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
                    {isKycVerified ? (profile?.kyc_user_type === 'non_student' ? 'Verified Store Partner (Outsider)' : 'Verified Store Owner') : 'Store Owner KYC'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.kyc_user_type === 'non_student' ? 'Government ID & Biometric Face Verification' : 'Student ID & Business credentials'}
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

            {/* Row 5: Help & Premium Support */}
            <div
              onClick={() => setShowSupportModal(true)}
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
                  <i className="fa-solid fa-headset" />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Help & Premium Support
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#10B981', marginTop: '1px', fontWeight: '600' }}>
                    salesflowingai@gmail.com
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--primary-light)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px'
                }}>
                  Support
                </span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} />
              </div>
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
      {/* STORE OWNER COMPLETE KYC MODAL                                */}
      {/* ============================================================== */}
      {showStoreKycModal && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            stopCamera();
            setShowStoreKycModal(false);
          }} 
          style={{ zIndex: 1200, padding: '0.75rem' }}
        >
          <div 
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '1.35rem 1.15rem',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Merchant Onboarding & KYC
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0.15rem 0 0 0' }}>
                  Store Owner Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowStoreKycModal(false);
                }}
                style={{
                  background: 'var(--surface-alt)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
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
                padding: '0.7rem 0.9rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                marginBottom: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fa-solid fa-circle-exclamation" />
                <span>{storeKycError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStoreKyc} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              {/* Segmented Pill Selector: Student vs I'm not a student */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem' }}>
                  I am registering as: *
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  backgroundColor: 'var(--surface-alt)',
                  padding: '3px',
                  borderRadius: '9999px',
                  gap: '4px',
                  border: '1px solid var(--border)'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setKycUserType('student');
                      setStoreKycError('');
                    }}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: kycUserType === 'student' ? 'var(--primary)' : 'transparent',
                      color: kycUserType === 'student' ? '#FFFFFF' : 'var(--text-muted)',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className="fa-solid fa-graduation-cap" />
                    <span>Campus Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKycUserType('non_student');
                      setStoreKycError('');
                    }}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: '9999px',
                      border: 'none',
                      backgroundColor: kycUserType === 'non_student' ? 'var(--primary)' : 'transparent',
                      color: kycUserType === 'non_student' ? '#FFFFFF' : 'var(--text-muted)',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <i className="fa-solid fa-user-shield" />
                    <span>I'm not a student</span>
                  </button>
                </div>
              </div>

              {/* Outsider Security Alert Banner */}
              {kycUserType === 'non_student' && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.22)',
                  borderRadius: '14px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start'
                }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#10B981', fontSize: '1.05rem', marginTop: '2px' }} />
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    <strong style={{ color: '#10B981', display: 'block', marginBottom: '1px' }}>
                      Campus Safety & Security Verification
                    </strong>
                    Outsider merchants must provide valid Government ID and a live face verification photo to prevent fraud and illegal campus activities.
                  </div>
                </div>
              )}

              {/* Official Store Name */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  Official Store / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={storeForm.business_name || ''}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="e.g. Kev's Campus Thrifts"
                />
              </div>

              {/* Business Category */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  Business Category *
                </label>
                <select
                  className="form-input"
                  value={storeForm.business_category || 'Fashion & Thrift'}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_category: e.target.value }))}
                  style={{ cursor: 'pointer' }}
                >
                  {STORE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* NON-STUDENT KYC FIELDS */}
              {kycUserType === 'non_student' ? (
                <>
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                      Government ID Document Type *
                    </label>
                    <select
                      className="form-input"
                      value={storeForm.id_type || 'nin'}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, id_type: e.target.value }))}
                      style={{ cursor: 'pointer' }}
                    >
                      {GOVERNMENT_ID_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', fontSize: '0.82rem' }}>
                        {(GOVERNMENT_ID_TYPES.find(t => t.id === storeForm.id_type)?.name || 'Government ID')} Number *
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '800' }}>
                        Required
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={storeForm.id_number || ''}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, id_number: e.target.value }))}
                      placeholder={GOVERNMENT_ID_TYPES.find(t => t.id === storeForm.id_type)?.placeholder || 'Enter ID number'}
                    />
                  </div>

                  {/* ID Document Card Upload */}
                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                      Upload Government ID Card / Slip Photo *
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
                        border: '1.5px solid #10B981',
                        height: '135px',
                        backgroundColor: 'var(--surface-alt)'
                      }}>
                        <img 
                          src={idCardPreview} 
                          alt="Government ID Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0,0,0,0.75)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }} />
                          <span>Government ID Attached</span>
                        </div>
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
                          padding: '1rem',
                          textAlign: 'center',
                          backgroundColor: 'var(--surface-alt)',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-id-card" style={{ fontSize: '1.35rem', color: 'var(--primary)', marginBottom: '0.3rem' }} />
                        <div style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                          Tap to Upload Government ID Card / Slip
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          NIN slip, voter card, driver license, or passport page
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Biometric Face Verification */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', fontSize: '0.82rem' }}>
                        Biometric Face Verification *
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <i className="fa-solid fa-camera" /> Anti-Fraud Check
                      </span>
                    </div>

                    {/* Hidden Native Camera & Gallery Inputs */}
                    <input
                      type="file"
                      ref={selfieCameraInputRef}
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieFile}
                      style={{ display: 'none' }}
                    />
                    <input
                      type="file"
                      ref={selfieGalleryInputRef}
                      accept="image/*"
                      onChange={handleSelfieFile}
                      style={{ display: 'none' }}
                    />

                    {cameraStreamActive ? (
                      <div style={{
                        position: 'relative',
                        borderRadius: '18px',
                        overflow: 'hidden',
                        backgroundColor: '#000000',
                        textAlign: 'center',
                        border: '2px solid #10B981',
                        padding: '0.75rem 0.5rem'
                      }}>
                        <div style={{
                          position: 'relative',
                          width: '190px',
                          height: '190px',
                          margin: '0 auto',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '3px dashed #10B981'
                        }}>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                          />
                        </div>
                        <div style={{ color: '#FFFFFF', fontSize: '0.76rem', marginTop: '0.6rem', fontWeight: '600' }}>
                          Look directly at camera & align face
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={stopCamera}
                            style={{
                              padding: '0.45rem 1rem',
                              borderRadius: '9999px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              backgroundColor: 'transparent',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={captureFromVideo}
                            style={{
                              padding: '0.5rem 1.3rem',
                              borderRadius: '9999px',
                              border: 'none',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              fontSize: '0.82rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <i className="fa-solid fa-camera" />
                            <span>Capture Face</span>
                          </button>
                        </div>
                      </div>
                    ) : isFaceScanning ? (
                      <div style={{
                        border: '2px dashed #10B981',
                        borderRadius: '18px',
                        padding: '1.75rem 1rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(16, 185, 129, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div className="spinner" style={{ width: '32px', height: '32px', borderColor: 'rgba(16, 185, 129, 0.25)', borderTopColor: '#10B981', marginBottom: '0.65rem' }} />
                        <div style={{ fontWeight: '800', fontSize: '0.84rem', color: '#10B981' }}>
                          Verifying Face Biometrics...
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Confirming live identity check
                        </div>
                      </div>
                    ) : selfiePreview ? (
                      <div style={{
                        border: '1.5px solid #10B981',
                        borderRadius: '18px',
                        padding: '0.75rem 0.9rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '2.5px solid #10B981',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
                            flexShrink: 0
                          }}>
                            <img src={selfiePreview} alt="Face Verification" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-circle-check" style={{ color: '#10B981' }} />
                              <span>Biometric Face Verified</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Face selfie matched against ID
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelfiePreview(null);
                            setStoreForm(prev => ({ ...prev, face_selfie_image: null }));
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '9999px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-main)',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          Retake
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        border: '2px dashed var(--primary)',
                        borderRadius: '18px',
                        padding: '1.1rem 0.9rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--surface-alt)'
                      }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          margin: '0 auto 0.5rem auto'
                        }}>
                          <i className="fa-solid fa-face-smile" />
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                          Take Live Face Verification Selfie
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '0.75rem' }}>
                          Look directly at camera to verify you match your Government ID
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => selfieCameraInputRef.current?.click()}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '9999px',
                              border: 'none',
                              backgroundColor: 'var(--primary)',
                              color: '#FFFFFF',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 4px 10px var(--primary-light)'
                            }}
                          >
                            <i className="fa-solid fa-camera" />
                            <span>Take Selfie</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => selfieGalleryInputRef.current?.click()}
                            style={{
                              padding: '0.5rem 0.9rem',
                              borderRadius: '9999px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <i className="fa-solid fa-upload" />
                            <span>Upload</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* STUDENT KYC FIELDS */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontWeight: '700', fontSize: '0.82rem' }}>
                        Student ID / Matriculation Number *
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>
                        KYC Required
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={storeForm.student_id_number || ''}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, student_id_number: e.target.value }))}
                      placeholder="e.g. LCU/22/10452 or UI/21/9831"
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      Used to verify active student enrollment for your campus merchant badge.
                    </span>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
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
                        height: '135px',
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
                          padding: '1rem',
                          textAlign: 'center',
                          backgroundColor: 'var(--surface-alt)',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fa-solid fa-camera" style={{ fontSize: '1.35rem', color: 'var(--primary)', marginBottom: '0.3rem' }} />
                        <div style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                          Tap to Upload Student ID Card Photo
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          School ID card or student portal screenshot
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Delivery / Hostel / Campus Pickup Spot */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  {kycUserType === 'non_student' ? 'Store Address / Campus Delivery Meeting Spot' : 'Hostel / Campus Pickup Spot'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_address || ''}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_address: e.target.value }))}
                  placeholder={kycUserType === 'non_student' ? 'e.g. Campus Main Gate, Off-Campus Shop #4, or Car Park' : 'e.g. SUB Car Park or Peace Hall Room B12'}
                />
              </div>

              {/* WhatsApp Contact */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  Business WhatsApp Contact *
                </label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={storeForm.business_whatsapp || ''}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_whatsapp: e.target.value }))}
                  placeholder="e.g. 08012345678"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                  Buyer inquiries and verified badge alerts will be sent here.
                </span>
              </div>

              {/* Instagram Handle */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  Store Instagram Handle (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeForm.business_instagram || ''}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_instagram: e.target.value }))}
                  placeholder="e.g. @kevs_thrifts"
                />
              </div>

              {/* Store Tagline */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>
                  Store Bio / Tagline (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={storeForm.business_description || ''}
                  onChange={(e) => setStoreForm(prev => ({ ...prev, business_description: e.target.value }))}
                  placeholder="e.g. Daily hostel deliveries for thrift fits, kicks, and phone accessories."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowStoreKycModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '0.84rem',
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
                    padding: '0.75rem',
                    borderRadius: '9999px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    opacity: isSavingStoreKyc ? 0.7 : 1,
                    boxShadow: '0 4px 14px var(--primary-light)'
                  }}
                >
                  {isSavingStoreKyc ? 'Verifying & Submitting...' : (kycUserType === 'non_student' ? 'Verify Merchant ID & Face' : 'Submit & Complete KYC')}
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

      {/* Help & Support Modal returning to salesflowingai@gmail.com */}
      {showSupportModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowSupportModal(false)}
          style={{ zIndex: 1200, padding: '0.85rem' }}
        >
          <div 
            className="modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '1.4rem 1.25rem',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-headset" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: 0 }}>
                    Help & Support
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Direct desk: <strong style={{ color: '#10B981' }}>salesflowingai@gmail.com</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                style={{
                  background: 'var(--surface-alt)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Support Email Card (Clean single card, no nested borders) */}
            <div style={{
              backgroundColor: 'var(--surface-alt)',
              borderRadius: '18px',
              padding: '0.95rem 1rem',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-regular fa-envelope" style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />
                  <span style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    salesflowingai@gmail.com
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('salesflowingai@gmail.com');
                    setSupportCopied(true);
                    setTimeout(() => setSupportCopied(false), 2000);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: supportCopied ? '#10B981' : 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '4px 6px'
                  }}
                >
                  <i className={`fa-solid ${supportCopied ? 'fa-check' : 'fa-copy'}`} />
                  <span>{supportCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <a
                  href="mailto:salesflowingai@gmail.com?subject=CampusStash%20Support%20Inquiry"
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px var(--primary-light)'
                  }}
                >
                  <i className="fa-solid fa-paper-plane" />
                  <span>Open Email App</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowSupportModal(false);
                    setSettingsDefaultTab('safety');
                    setIsSettingsOpen(true);
                  }}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <i className="fa-solid fa-shield-halved" />
                  <span>Safety Rules</span>
                </button>
              </div>
            </div>

            {/* In-App Direct Message Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const subject = encodeURIComponent(`CampusStash Support [${supportTopic}] - ${profile?.name || profile?.email || 'User'}`);
                const body = encodeURIComponent(
                  `User: ${profile?.name || ''} (${profile?.email || ''})\n` +
                  `Campus: ${activeCampusObj?.name || 'Lead City University'}\n` +
                  `Topic: ${supportTopic}\n\n` +
                  `Message Details:\n${supportMessage}`
                );
                window.location.href = `mailto:salesflowingai@gmail.com?subject=${subject}&body=${body}`;
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', textTransform: 'none' }}>
                  What do you need help with?
                </label>
                <select
                  className="form-input"
                  value={supportTopic}
                  onChange={(e) => setSupportTopic(e.target.value)}
                  style={{ cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  <option value="General Support">General Support & Question</option>
                  <option value="Store KYC Verification">Store KYC Verification Help</option>
                  <option value="Payment & Transaction">Payment or Listing Issue</option>
                  <option value="Report Suspicious User">Report Suspicious Activity / Fraud</option>
                  <option value="Campus Partnership">Campus Partnership & Suggestions</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.82rem', display: 'block', marginBottom: '0.35rem', textTransform: 'none' }}>
                  Your Message Details
                </label>
                <textarea
                  required
                  rows={3}
                  className="form-input"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or inquiry in detail..."
                  style={{ fontSize: '0.84rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px var(--primary-light)',
                  marginTop: '0.25rem'
                }}
              >
                <i className="fa-solid fa-envelope" />
                <span>Send to salesflowingai@gmail.com</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
