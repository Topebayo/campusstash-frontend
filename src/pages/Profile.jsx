import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getImageUrl, getServerHost, DEFAULT_HOST_IP } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EditListingModal from '../components/EditListingModal';
import CreateListingModal from '../components/CreateListingModal';
import SettingsModal from '../components/SettingsModal';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Form State
  const [phone, setPhone] = useState('');
  const [burnerHandle, setBurnerHandle] = useState('');
  const [serverIp, setServerIp] = useState(() => localStorage.getItem('server_ip') || DEFAULT_HOST_IP);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [listingActionId, setListingActionId] = useState(null);

  // Edit Modal State
  const [editingListing, setEditingListing] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await apiFetch('/users/me');
      setProfile(data);
      setPhone(data.phone || '');
      setBurnerHandle(data.profile?.burner_handle || '');
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
      setMyListings(data);
    } catch (err) {
      console.error("Failed to load my listings:", err);
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
  }, [navigate]);



  const handleSave = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setMessage('Phone number is required.');
      return;
    }
    setIsSaving(true);
    setMessage('');
    try {
      if (serverIp.trim()) { localStorage.setItem('server_ip', serverIp.trim()); } else { localStorage.removeItem('server_ip'); }
      setMessage('Profile settings up to date.');
      setProfile(updated);
      setPhone(updated.phone || '');
      setBurnerHandle(updated.profile?.burner_handle || '');
      if (serverIp.trim()) { localStorage.setItem('server_ip', serverIp.trim()); } else { localStorage.removeItem('server_ip'); }
      setMessage('Profile settings updated successfully!');
    } catch (err) {
      setMessage(err.message || 'Failed to update settings.');
    }
    setIsSaving(false);
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    setListingActionId(listingId);
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
    try {
      const updated = await apiFetch(`/listings/${listingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      setMyListings(prev => prev.map(item => item.id === listingId ? { ...item, status: updated.status, is_active: updated.is_active } : item));
    } catch (err) {
      alert(err.message || 'Failed to update listing status.');
    } finally {
      setListingActionId(null);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) {
      return;
    }
    setListingActionId(listingId);
    try {
      await apiFetch(`/listings/${listingId}`, {
        method: 'DELETE'
      });
      setMyListings(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      alert(err.message || 'Failed to delete listing.');
    } finally {
      setListingActionId(null);
    }
  };

  const handleOpenEdit = (listing) => {
    setEditingListing(listing);
    setIsEditModalOpen(true);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 2.5rem 1rem', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', flex: 1 }} className="animate-fade-in">
        
        {/* Header Profile Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          padding: '1.5rem 1.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--lightgreen)',
              color: 'var(--brandgreen)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.85rem',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-user-shield" />
            </div>

            <div style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.65rem',
                  fontWeight: '800',
                  color: 'var(--text-main)',
                  margin: 0
                }}>
                  @{burnerHandle || profile?.profile?.burner_handle || 'anonymous'}
                </h1>
                <span className="badge-pill">
                  <i className="fa-solid fa-circle-check" /> Verified Phone
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                {profile?.email || 'Student Account'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>
                Active Listings
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '800', color: 'var(--brandblue)' }}>
                {myListings.filter(l => l.status !== 'sold').length}
              </span>
            </div>

            <div style={{
              flex: 1,
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-color)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', display: 'block' }}>
                Sold Listings
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {myListings.filter(l => l.status === 'sold').length}
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '2rem'
        }} className="profile-grid-container">
          
          {/* Column 1: Settings Form */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '24px',
            padding: '1.75rem 1.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            height: 'fit-content'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              marginBottom: '0.4rem'
            }}>
              Edit Anonymous Identity
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Your handle is what other students see in the marketplace and chats.
            </p>

            {message && (
              <div style={{ 
                color: message.includes('success') ? 'var(--darkgreen)' : '#b91c1c', 
                backgroundColor: message.includes('success') ? 'var(--lightgreen)' : '#fee2e2',
                border: '1px solid',
                borderColor: message.includes('success') ? 'rgba(16,185,129,0.3)' : '#fecaca',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className={message.includes('success') ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"} />
                {message}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label">Email Address (Read-only)</label>
                <input 
                  className="form-input"
                  type="email" 
                  disabled
                  value={profile?.email || ''} 
                  style={{ backgroundColor: '#f9fafb', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label className="form-label">Burner Handle (Public Alias)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                    fontWeight: '600'
                  }}>
                    @
                  </span>
                  <input 
                    className="form-input"
                    type="text" 
                    disabled
                    value={burnerHandle} 
                    placeholder="e.g. shadow99"
                    style={{ paddingLeft: '2.25rem', backgroundColor: '#f9fafb', color: 'var(--text-muted)', cursor: 'not-allowed' }} 
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--brandblue)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                    <i className="fa-solid fa-lock" /> Username is permanently locked
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Phone Number (SMS Verification)</label>
                <input 
                  className="form-input"
                  type="tel" 
                  disabled
                  value={phone} 
                  placeholder="e.g. +234 800 000 0000"
                  style={{ backgroundColor: '#f9fafb', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--brandgreen)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                  <i className="fa-solid fa-shield-halved" /> Verified phone number (locked for security)
                </span>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSaving}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="btn-secondary"
                style={{ width: '100%', marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
              >
                <i className="fa-solid fa-gear" style={{ color: 'var(--brandblue)' }} />
                <span>Account & Security Settings</span>
              </button>


            </form>
          </div>

          {/* Column 2: Manage My Listings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: 'var(--text-main)',
                  margin: 0
                }}>
                  Manage My Listings
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total: {myListings.length} {myListings.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button 
                className="btn-primary"
                onClick={() => setIsCreateOpen(true)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
              >
                <i className="fa-solid fa-plus" /> Post Another Item
              </button>
            </div>

            {myListings.length === 0 ? (
              <div style={{
                padding: '2.5rem 1.5rem',
                border: '2px dashed var(--border)',
                borderRadius: '20px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--surface)',
                textAlign: 'center'
              }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: '2rem', color: 'var(--brandgreen)', opacity: 0.6, marginBottom: '0.75rem', display: 'block' }} />
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  No Listings Posted Yet
                </h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.1rem' }}>
                  Have an old textbook, calculator, or phone charger lying around?
                </p>
                <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
                  Post Your First Listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {myListings.map(listing => {
                  const isSold = listing.status === 'sold';
                  const priceFormatted = (listing.price_kobo ? (listing.price_kobo / 100) : (listing.price || 0)).toLocaleString();

                  return (
                    <div 
                      key={listing.id} 
                      className="listing-card"
                      style={{
                        padding: '1.1rem',
                        opacity: isSold ? 0.75 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--surface)',
                        borderRadius: '20px',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div>
                        {/* Image Container */}
                        <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.85rem', backgroundColor: 'var(--surface-alt)' }}>
                          {listing.image_url ? (
                            <img 
                              src={getImageUrl(listing.image_url)} 
                              alt={listing.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fb = e.currentTarget.parentElement?.querySelector('.listing-placeholder');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="listing-placeholder" style={{ width: '100%', height: '100%', borderRadius: 0, margin: 0, display: listing.image_url ? 'none' : 'flex' }}>
                            <i className="fa-regular fa-image" style={{ fontSize: '1.5rem', opacity: 0.4 }} />
                          </div>
                          
                          {/* Status Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '0.6rem',
                            left: '0.6rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-display)',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            backgroundColor: isSold ? '#4b5563' : 'var(--brandgreen)',
                            color: '#ffffff'
                          }}>
                            <i className={isSold ? 'fa-solid fa-circle-check' : 'fa-solid fa-bolt'} style={{ marginRight: '0.3rem' }} /> {isSold ? 'Sold' : 'Active'}
                          </div>
                        </div>

                        <h3 style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.05rem',
                          fontWeight: '700',
                          lineHeight: '1.3',
                          color: 'var(--text-main)',
                          marginBottom: '0.25rem'
                        }}>
                          {listing.title}
                        </h3>

                        <p style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.15rem',
                          fontWeight: '800',
                          color: 'var(--brandgreen)',
                          marginBottom: '0.75rem'
                        }}>
                          ₦{priceFormatted}
                        </p>
                      </div>

                      {/* Controls Footer */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          <button
                            onClick={() => handleToggleStatus(listing.id, listing.status)}
                            style={{
                              flex: 1,
                              padding: '0.45rem 0.6rem',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: '1px solid var(--border)',
                              backgroundColor: isSold ? 'var(--lightgreen)' : '#f3f4f6',
                              color: isSold ? 'var(--darkgreen)' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            <i className={isSold ? 'fa-solid fa-rotate-right' : 'fa-solid fa-circle-check'} style={{ marginRight: '0.3rem' }} /> {isSold ? 'Relist' : 'Mark Sold'}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(listing)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: 'none',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditListingModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        listing={editingListing}
        onUpdated={() => {
          fetchMyListings();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={profile}
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        }}
      />
      <Footer />
    </div>
  );
}

export default Profile;