import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, getImageUrl } from '../api';

export default function AdminPage() {
  const navigate = useNavigate();

  // Authentication & Access state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('telco'); // 'overview' | 'telco' | 'users' | 'kyc' | 'listings'

  // Data states
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Telco Bypass state
  const [directIdentifier, setDirectIdentifier] = useState('');
  const [directLoading, setDirectLoading] = useState(false);
  const [directFeedback, setDirectFeedback] = useState(null);
  const [recentOtps, setRecentOtps] = useState([]);
  const [loadingOtps, setLoadingOtps] = useState(false);

  // Users Directory state
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [verifyingUserId, setVerifyingUserId] = useState(null);

  // KYC Review state
  const [pendingKyc, setPendingKyc] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycActionLoading, setKycActionLoading] = useState(null);
  const [imageModalUrl, setImageModalUrl] = useState(null);

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingQuery, setListingQuery] = useState('');
  const [loadingListings, setLoadingListings] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 1. Initial Admin Check
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setCheckingAuth(true);
    try {
      const res = await adminApi.getMe();
      if (res && res.is_admin) {
        setIsAdmin(true);
        setAdminUser(res);
        loadAllData();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadAllData = () => {
    fetchStats();
    fetchRecentOtps();
    fetchUsers('');
    fetchPendingKyc();
  };

  // 2. Data Fetchers
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await adminApi.getStats();
      setStats(res);
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentOtps = async () => {
    setLoadingOtps(true);
    try {
      const res = await adminApi.getRecentOtps(30);
      setRecentOtps(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('OTPs error:', e);
    } finally {
      setLoadingOtps(false);
    }
  };

  const fetchUsers = async (query = '') => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers(query, 50, 0);
      setUsers(res.items || []);
      setTotalUsers(res.total || 0);
    } catch (e) {
      console.error('Users error:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingKyc = async () => {
    setLoadingKyc(true);
    try {
      const res = await adminApi.getPendingKyc();
      setPendingKyc(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('KYC error:', e);
    } finally {
      setLoadingKyc(false);
    }
  };

  const fetchListings = async (query = '') => {
    setLoadingListings(true);
    try {
      const res = await adminApi.getListings(query, 40, 0);
      setListings(res.items || []);
    } catch (e) {
      console.error('Listings error:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  // 3. Actions
  const handleDirectVerify = async (e) => {
    e.preventDefault();
    if (!directIdentifier.trim()) return;
    setDirectLoading(true);
    setDirectFeedback(null);
    try {
      const res = await adminApi.verifyDirect(directIdentifier.trim());
      setDirectFeedback({ type: 'success', message: res.message || 'Verified successfully!' });
      setDirectIdentifier('');
      fetchStats();
      fetchUsers(userQuery);
      fetchRecentOtps();
    } catch (err) {
      setDirectFeedback({ type: 'error', message: err.message || 'Verification failed.' });
    } finally {
      setDirectLoading(false);
    }
  };

  const handleForceVerifyUser = async (userId) => {
    setVerifyingUserId(userId);
    try {
      const res = await adminApi.forceVerifyUser(userId);
      setDirectFeedback({ type: 'success', message: res.message || 'User verified!' });
      fetchUsers(userQuery);
      fetchStats();
      fetchRecentOtps();
    } catch (err) {
      alert(err.message || 'Failed to verify user');
    } finally {
      setVerifyingUserId(null);
    }
  };

  const handleKycApprove = async (userId) => {
    setKycActionLoading(userId);
    try {
      await adminApi.approveKyc(userId);
      setPendingKyc(prev => prev.filter(k => k.id !== userId));
      fetchStats();
    } catch (e) {
      alert(e.message || 'Error approving KYC');
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleKycReject = async (userId) => {
    const reason = prompt('Reason for rejection (e.g., blurry ID card, selfie mismatch):');
    if (reason === null) return;
    setKycActionLoading(userId);
    try {
      await adminApi.rejectKyc(userId, reason);
      setPendingKyc(prev => prev.filter(k => k.id !== userId));
      fetchStats();
    } catch (e) {
      alert(e.message || 'Error rejecting KYC');
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to delete listing "${title}"?`)) return;
    setDeletingId(listingId);
    try {
      await adminApi.deleteListing(listingId);
      setListings(prev => prev.filter(l => l.id !== listingId));
      fetchStats();
    } catch (e) {
      alert(e.message || 'Error deleting listing');
    } finally {
      setDeletingId(null);
    }
  };

  // 4. If checking or unauthorized, render gate
  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#C87A5B' }}></i>
      </div>
    );
  }

  // If user has no token at all, offer clean Admin Sign-In
  const hasToken = !!localStorage.getItem('token');
  if (!hasToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'sans-serif' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: '#C87A5B',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 4px 14px rgba(200, 122, 91, 0.35)'
        }}>
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 0.5rem' }}>CampusStash Admin Access</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '1.8rem', fontSize: '0.9rem', lineHeight: '1.45' }}>
          Please sign in with your authorized administrator account to access the command center.
        </p>
        <button
          onClick={() => navigate('/auth?redirect=/admin')}
          style={{
            backgroundColor: '#C87A5B',
            color: '#FFF',
            border: 'none',
            padding: '0.85rem 1.8rem',
            borderRadius: '9999px',
            fontWeight: '800',
            fontSize: '0.92rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(200, 122, 91, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="fa-brands fa-google"></i>
          Sign In with Admin Account
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', color: '#C87A5B', margin: 0 }}>404</h1>
        <h2 style={{ fontSize: '1.4rem', margin: '0.5rem 0 1rem' }}>Page Not Found</h2>
        <p style={{ color: '#78716C', maxWidth: '360px', marginBottom: '2rem', fontSize: '0.95rem' }}>
          The page you requested could not be found or you do not have permission to view it.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.75rem 1.4rem', borderRadius: '9999px', fontWeight: '700', cursor: 'pointer' }}
          >
            Storefront
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/auth?redirect=/admin');
            }}
            style={{ backgroundColor: '#C87A5B', color: '#FFF', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '9999px', fontWeight: '700', cursor: 'pointer' }}
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  // 5. Admin Dashboard View
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', paddingBottom: '5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.85rem 1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#C87A5B',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: '900',
            boxShadow: '0 2px 8px rgba(200, 122, 91, 0.35)'
          }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '800', lineHeight: 1.2 }}>CampusStash Admin</div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }}></span>
              Live Control ({adminUser?.email})
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--surface-alt)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            padding: '0.45rem 0.9rem',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-store" style={{ color: '#C87A5B' }}></i>
          Storefront
        </button>
      </header>

      {/* Main Content Container */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.2rem 1rem' }}>

        {/* Global Stats Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}><i className="fa-solid fa-users" style={{ color: '#3B82F6' }}></i> Total Students</div>
            <div style={statValStyle}>{stats?.total_users ?? '...'}</div>
            <div style={statSubStyle}>+{stats?.users_last_24h || 0} today</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}><i className="fa-solid fa-circle-check" style={{ color: '#10B981' }}></i> Verified Phones</div>
            <div style={statValStyle}>{stats?.verified_users ?? '...'}</div>
            <div style={statSubStyle}>{stats?.unverified_users || 0} pending</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}><i className="fa-solid fa-id-card" style={{ color: '#F59E0B' }}></i> Store KYC</div>
            <div style={statValStyle}>{stats?.pending_kyc ?? '...'}</div>
            <div style={statSubStyle}>Needs review</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}><i className="fa-solid fa-tag" style={{ color: '#C87A5B' }}></i> Active Listings</div>
            <div style={statValStyle}>{stats?.active_listings ?? '...'}</div>
            <div style={statSubStyle}>{stats?.total_campuses || 35} campuses</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem',
          marginBottom: '1.2rem',
          overflowX: 'auto',
        }}>
          {[
            { id: 'telco', label: '⚡ Telco & SMS Bypass', count: null },
            { id: 'users', label: '👥 Student Directory', count: totalUsers },
            { id: 'kyc', label: '🪪 KYC Reviews', count: pendingKyc.length },
            { id: 'listings', label: '📦 Listings Moderation', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'listings' && listings.length === 0) fetchListings('');
              }}
              style={{
                backgroundColor: activeTab === tab.id ? '#C87A5B' : 'var(--surface)',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid #C87A5B' : '1px solid var(--border)',
                borderRadius: '9999px',
                padding: '0.5rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? '#FFFFFF' : '#EF4444',
                  color: activeTab === tab.id ? '#C87A5B' : '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ================= TAB 1: TELCO & SMS BYPASS ================= */}
        {activeTab === 'telco' && (
          <div>
            {/* Quick 1-Tap Verification Bar */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <i className="fa-solid fa-bolt" style={{ color: '#F59E0B', fontSize: '1.1rem' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Instant Student Telco Bypass</h3>
              </div>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                If a student on MTN, Airtel, Glo, or 9mobile did not receive their SMS OTP, enter their phone number (e.g. <code>09124367501</code>) or email to immediately mark them verified.
              </p>

              <form onSubmit={handleDirectVerify} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter phone (090...) or student email"
                  value={directIdentifier}
                  onChange={(e) => setDirectIdentifier(e.target.value)}
                  style={{
                    flex: '1 1 240px',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={directLoading}
                  style={{
                    backgroundColor: '#C87A5B',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.4rem',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: directLoading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {directLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check-double"></i>}
                  Force Verify Now
                </button>
              </form>

              {directFeedback && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  backgroundColor: directFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: directFeedback.type === 'success' ? '#10B981' : '#EF4444',
                  border: `1px solid ${directFeedback.type === 'success' ? '#10B981' : '#EF4444'}`,
                }}>
                  {directFeedback.message}
                </div>
              )}
            </div>

            {/* Live OTP Feed */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-comment-sms" style={{ color: '#3B82F6', fontSize: '1.1rem' }}></i>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Live In-Flight OTP Codes</h3>
                </div>
                <button
                  onClick={fetchRecentOtps}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C87A5B',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <i className={`fa-solid fa-rotate-right ${loadingOtps ? 'fa-spin' : ''}`}></i> Refresh
                </button>
              </div>

              {loadingOtps ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: '#C87A5B', fontSize: '1.4rem' }}></i>
                </div>
              ) : recentOtps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No recent OTP records found.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {recentOtps.map(otp => (
                    <div
                      key={otp.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{otp.phone}</span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: otp.is_verified ? 'rgba(16, 185, 129, 0.15)' : (otp.is_expired ? 'rgba(120, 113, 108, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                          color: otp.is_verified ? '#10B981' : (otp.is_expired ? '#78716C' : '#F59E0B'),
                        }}>
                          {otp.is_verified ? 'VERIFIED' : (otp.is_expired ? 'EXPIRED' : 'WAITING')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OTP Code:</span>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '1.25rem',
                          fontWeight: '900',
                          letterSpacing: '2px',
                          color: '#C87A5B',
                          backgroundColor: 'var(--surface)',
                          padding: '0.1rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                        }}>
                          {otp.otp_code}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Attempts: {otp.attempts}/5</span>
                        <span>{new Date(otp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: STUDENT DIRECTORY ================= */}
        {activeTab === 'users' && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by student name, email, or phone..."
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  fetchUsers(e.target.value);
                }}
                style={{
                  flex: '1 1 240px',
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => fetchUsers(userQuery)}
                style={{
                  backgroundColor: '#C87A5B',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.7rem 1.2rem',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: '#C87A5B', fontSize: '1.5rem' }}></i>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No students match your query.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{u.name}</span>
                        {u.account_type === 'business' && (
                          <span style={{ fontSize: '0.68rem', fontWeight: '800', backgroundColor: '#3B82F6', color: '#FFF', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            STORE
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          backgroundColor: u.is_phone_verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.is_phone_verified ? '#10B981' : '#EF4444',
                        }}>
                          {u.is_phone_verified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <span>{u.email}</span> &bull; <span>{u.phone}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#C87A5B', fontWeight: '600', marginTop: '0.15rem' }}>
                        🎓 {u.campus} {u.latest_otp && <span>&bull; Latest OTP: <b>{u.latest_otp}</b></span>}
                      </div>
                    </div>

                    {!u.is_phone_verified && (
                      <button
                        onClick={() => handleForceVerifyUser(u.id)}
                        disabled={verifyingUserId === u.id}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {verifyingUserId === u.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                        Force Verify
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: KYC REVIEWS ================= */}
        {activeTab === 'kyc' && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Store Owner KYC Verification Queue</h3>
              <button
                onClick={fetchPendingKyc}
                style={{ background: 'none', border: 'none', color: '#C87A5B', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <i className={`fa-solid fa-rotate-right ${loadingKyc ? 'fa-spin' : ''}`}></i> Refresh
              </button>
            </div>

            {loadingKyc ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: '#C87A5B', fontSize: '1.5rem' }}></i>
              </div>
            ) : pendingKyc.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: '#10B981', display: 'block', marginBottom: '0.8rem' }}></i>
                All caught up! No pending store verifications.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingKyc.map(k => (
                  <div
                    key={k.id}
                    style={{
                      padding: '1.2rem',
                      borderRadius: '14px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{k.business_name || k.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Owner: <b>{k.name}</b> &bull; {k.email} &bull; {k.phone}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#C87A5B', marginTop: '0.2rem' }}>
                          🎓 {k.campus} &bull; Type: <b>{k.kyc_user_type === 'non_student' ? 'Outsider Store (Gov ID)' : 'Student Merchant'}</b>
                        </div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          ID Document: <b>{k.kyc_id_type?.toUpperCase()} ({k.kyc_id_number || 'N/A'})</b>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleKycApprove(k.id)}
                          disabled={kycActionLoading === k.id}
                          style={{
                            backgroundColor: '#10B981',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.55rem 1rem',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <i className="fa-solid fa-check"></i> Approve
                        </button>
                        <button
                          onClick={() => handleKycReject(k.id)}
                          disabled={kycActionLoading === k.id}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#EF4444',
                            border: '1px solid #EF4444',
                            borderRadius: '8px',
                            padding: '0.55rem 0.9rem',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Image Previews */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {k.kyc_id_card_url && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ID DOCUMENT</div>
                          <img
                            src={getImageUrl(k.kyc_id_card_url)}
                            alt="ID Document"
                            onClick={() => setImageModalUrl(getImageUrl(k.kyc_id_card_url))}
                            style={{
                              width: '140px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              cursor: 'zoom-in',
                            }}
                          />
                        </div>
                      )}
                      {k.kyc_selfie_url && (
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>BIOMETRIC SELFIE</div>
                          <img
                            src={getImageUrl(k.kyc_selfie_url)}
                            alt="Selfie"
                            onClick={() => setImageModalUrl(getImageUrl(k.kyc_selfie_url))}
                            style={{
                              width: '90px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              cursor: 'zoom-in',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: LISTINGS MODERATION ================= */}
        {activeTab === 'listings' && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search listings by title, seller, or category..."
                value={listingQuery}
                onChange={(e) => {
                  setListingQuery(e.target.value);
                  fetchListings(e.target.value);
                }}
                style={{
                  flex: '1 1 240px',
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => fetchListings(listingQuery)}
                style={{
                  backgroundColor: '#C87A5B',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.7rem 1.2rem',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Search
              </button>
            </div>

            {loadingListings ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ color: '#C87A5B', fontSize: '1.5rem' }}></i>
              </div>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No listings found.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                {listings.map(l => (
                  <div
                    key={l.id}
                    style={{
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {l.image_url && (
                      <img
                        src={getImageUrl(l.image_url)}
                        alt={l.title}
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{l.title}</div>
                        <div style={{ color: '#C87A5B', fontWeight: '900', fontSize: '1rem', marginBottom: '0.3rem' }}>
                          ₦{Number(l.price).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Seller: {l.seller_name} &bull; 🎓 {l.campus}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteListing(l.id, l.title)}
                        disabled={deletingId === l.id}
                        style={{
                          marginTop: '0.75rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          padding: '0.45rem',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <i className="fa-solid fa-trash"></i> Delete Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal for KYC Images */}
      {imageModalUrl && (
        <div
          onClick={() => setImageModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={imageModalUrl}
            alt="Preview"
            style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        </div>
      )}

    </div>
  );
}

const statCardStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '1rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const statLabelStyle = {
  fontSize: '0.78rem',
  fontWeight: '700',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  marginBottom: '0.35rem',
};

const statValStyle = {
  fontSize: '1.5rem',
  fontWeight: '900',
  lineHeight: 1.1,
};

const statSubStyle = {
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
  marginTop: '0.25rem',
};

