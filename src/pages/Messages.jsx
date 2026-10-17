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
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '5rem' }}>
      <Navbar />

      <div className="container animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1rem', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        
        {/* Header Banner */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '20px',
          padding: '1.5rem 1.25rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <span className="badge-pill" style={{ marginBottom: '0.5rem' }}>
            <i className="fa-solid fa-comments" /> Masked Inbox
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 5vw, 2.1rem)',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            color: 'var(--text-main)',
            marginBottom: '0.5rem',
            wordBreak: 'break-word'
          }}>
            Campus <span className="text-brandgreen">Conversations</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
            All chats are end-to-end masked with burner pseudonyms. Pick a conversation to view full history and negotiate.
          </p>
        </div>

        {/* Inbox Content */}
        {isLoading ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: '20px',
            border: '1px solid var(--border)'
          }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--brandgreen)', marginBottom: '1rem' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--text-main)' }}>
              Loading your campus chats...
            </p>
          </div>
        ) : error ? (
          <div style={{
            padding: '2rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ color: '#b91c1c', fontWeight: '600' }}>{error}</div>
            <button className="btn-primary" onClick={fetchInbox} style={{ alignSelf: 'flex-start' }}>
              Retry
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            border: '2px dashed var(--border)',
            borderRadius: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--lightgreen)',
              color: 'var(--brandgreen)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 1.25rem auto'
            }}>
              <i className="fa-regular fa-paper-plane" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Your Inbox is Clear
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
              When you message a student or someone contacts you about a listing, the conversation will appear here.
            </p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {threads.map(thread => {
              const convId = thread.id || thread.conversation_id;
              const title = thread.listing_title || thread.title || 'Campus Gear Chat';
              const peerName = thread.other_user?.burner_handle 
                ? `@${thread.other_user.burner_handle}`
                : (thread.other_user?.email || thread.other_user_email || 'Campus Peer');
              const unread = thread.unread_count || 0;
              const timeStr = thread.last_message_time || thread.updated_at || thread.created_at;

              return (
                <div 
                  key={convId || thread.listing_id} 
                  onClick={() => setActiveChatListing({ 
                    conversation_id: convId,
                    id: thread.listing_id || convId, 
                    title: title, 
                    seller_id: thread.other_user?.id || thread.other_user_id 
                  })} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.5rem', 
                    backgroundColor: 'var(--surface)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '18px', 
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brandgreen)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(16,185,129,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  {/* Avatar Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--lightgreen)',
                    color: 'var(--brandgreen)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-user-secret" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: '700',
                        fontSize: '1.15rem',
                        color: 'var(--text-main)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {title}
                      </h3>
                      {timeStr && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', flexShrink: 0, marginLeft: '1rem' }}>
                          {new Date(timeStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: '700',
                        color: 'var(--darkgreen)',
                        backgroundColor: 'var(--lightgreen)',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px'
                      }}>
                        Peer: {peerName}
                      </span>
                      {unread > 0 && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          color: '#ffffff',
                          backgroundColor: 'var(--brandgreen)',
                          padding: '0.1rem 0.5rem',
                          borderRadius: '9999px'
                        }}>
                          {unread} new
                        </span>
                      )}
                    </div>

                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0
                    }}>
                      {thread.last_message || 'Start conversation...'}
                    </p>
                  </div>

                  <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeChatListing && (
        <ChatModal 
          isOpen={!!activeChatListing}
          onClose={() => { setActiveChatListing(null); fetchInbox(); }}
          listing={activeChatListing}
        />
      )}
    </div>
  );
}

export default Messages;
