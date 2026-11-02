import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import Navbar from '../components/Navbar';
import ChatModal from '../components/ChatModal';

function Messages() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChatListing, setActiveChatListing] = useState(null);

  const fetchInbox = async () => {
    setIsLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await apiFetch('/conversations');
      } catch (e) {
        data = await apiFetch('/chat/inbox/me');
      }
      setThreads(data || []);
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
      setError(err.message || 'Failed to load messages.');
      if (err.message?.includes('credentials') || err.message?.includes('401')) {
        navigate('/auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchInbox();
  }, [navigate]);

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main 
        className="animate-fade-in" 
        style={{ 
          maxWidth: '520px', 
          margin: '0 auto', 
          padding: '0.5rem 1.15rem 7rem 1.15rem', 
          width: '100%', 
          boxSizing: 'border-box', 
          flex: 1 
        }}
      >
        {/* ============================================================== */}
        {/* TOP BAR: EDITORIAL TITLE                                        */}
        {/* ============================================================== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          padding: '0 0.25rem'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.85rem',
            fontWeight: '600',
            color: 'var(--text-main)',
            margin: 0
          }}>
            Messages
          </h1>

          <button
            onClick={fetchInbox}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--terracotta)',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Inbox Content */}
        {isLoading ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid var(--border)'
          }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--terracotta)', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.92rem' }}>
              Loading your campus chats...
            </p>
          </div>
        ) : error ? (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ color: '#B91C1C', fontWeight: '600', fontSize: '0.88rem' }}>{error}</div>
            <button 
              className="btn-primary" 
              onClick={fetchInbox} 
              style={{ alignSelf: 'flex-start', borderRadius: '9999px', padding: '0.45rem 1rem' }}
            >
              Retry
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div style={{
            padding: '3.5rem 1.5rem',
            borderRadius: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
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
              <i className="fa-regular fa-paper-plane" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Your Inbox is Clear
            </h3>
            <p style={{ maxWidth: '340px', margin: '0 auto 1.25rem auto', fontSize: '0.86rem', lineHeight: '1.45' }}>
              When you message a student or someone asks about your item, the conversation will appear here.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {threads.map(thread => {
              const convId = thread.id || thread.conversation_id;
              const title = thread.listing_title || thread.title || 'Campus Gear Chat';
              const peerName = thread.other_user?.burner_handle 
                ? `@${thread.other_user.burner_handle}`
                : (thread.other_user?.email ? thread.other_user.email.split('@')[0] : 'Campus Peer');
              const unread = thread.unread_count || 0;
              const timeStr = thread.last_message_time || thread.updated_at || thread.created_at;

              return (
                <div 
                  key={convId || thread.listing_id} 
                  onClick={() => setActiveChatListing({ 
                    conversation_id: convId,
                    id: thread.listing_id || convId, 
                    title: title, 
                    seller_id: thread.other_user?.id || thread.other_user_id,
                    seller_handle: peerName
                  })} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.1rem', 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid var(--border)', 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Peer Avatar */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--terracotta)',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {peerName.replace('@', '').charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <h3 style={{
                        fontWeight: '700',
                        fontSize: '0.96rem',
                        color: 'var(--text-main)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {peerName}
                      </h3>
                      {timeStr && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-light)', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {new Date(timeStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Regarding: {title}
                      </p>

                      {unread > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: '#FFFFFF',
                          backgroundColor: 'var(--terracotta)',
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          marginLeft: '0.5rem'
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Direct Chat Modal */}
      {activeChatListing && (
        <ChatModal 
          isOpen={true} 
          listing={activeChatListing} 
          onClose={() => {
            setActiveChatListing(null);
            fetchInbox();
          }} 
        />
      )}
    </div>
  );
}

export default Messages;
