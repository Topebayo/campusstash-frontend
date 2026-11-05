import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, getWebSocketUrl, getImageUrl, clearAppNotifications } from '../api';
import { Capacitor } from '@capacitor/core';
import ItemDetailModal from './ItemDetailModal';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function ChatModal({ isOpen = true, onClose, listing }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting, connected, error, disconnected
  const [currentUserId, setCurrentUserId] = useState(null);
  const [dropzones, setDropzones] = useState([]);
  const [showDropzonePicker, setShowDropzonePicker] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState('');
  const [modalListing, setModalListing] = useState(listing);
  const activeItem = modalListing || listing;
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const handleOpenItemDetail = async () => {
    if (activeItem?.is_request_chat) return;
    const targetId = activeItem?.id || activeItem?.listing_id || listing?.id || listing?.listing_id;
    if (!targetId) return;

    setDetailItem(activeItem);
    setShowItemDetail(true);

    try {
      const fullData = await apiFetch(`/listings/${targetId}`);
      if (fullData && fullData.id) {
        setDetailItem(fullData);
        setModalListing((prev) => ({ ...prev, ...fullData }));
      }
    } catch (e) {
      // Non-blocking fallback
    }
  };

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.sub) {
        setCurrentUserId(decoded.sub);
      }
    }
  }, []);

  useEffect(() => {
    setModalListing(listing);
    const targetListingId = listing?.id || listing?.listing_id;
    if (targetListingId && listing?.price_kobo === undefined && listing?.price === undefined) {
      apiFetch(`/listings/${targetListingId}`)
        .then((data) => {
          if (data && data.id) {
            setModalListing((prev) => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    }
  }, [listing]);

  // Fetch campus dropzones
  useEffect(() => {
    if (!listing) return;
    apiFetch('/dropzones/')
      .then((data) => {
        if (Array.isArray(data)) setDropzones(data);
        else if (data && data.items) setDropzones(data.items);
      })
      .catch((err) => console.error("Error fetching dropzones", err));
  }, [isOpen]);

  useEffect(() => {
    if (!listing) return;

    let isMounted = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setWsStatus('error');
      setError('Please log in to use chat.');
      return;
    }

    const initChat = async () => {
      try {
        setWsStatus('connecting');
        setError('');

        let convId = listing.conversation_id;
        if (!convId) {
          const bodyPayload = listing.request_id 
            ? { request_id: listing.request_id }
            : { listing_id: listing.id, recipient_id: listing.seller_id };
          const conv = await apiFetch('/conversations/', {
            method: 'POST',
            body: JSON.stringify(bodyPayload)
          });
          convId = conv.id;
        }

        if (!isMounted) return;
        setConversationId(convId);
        clearAppNotifications(convId);

        try {
          const historyData = await apiFetch(`/conversations/${convId}/messages`);
          if (isMounted) {
            setMessages(historyData.items || historyData || []);
          }
        } catch (hErr) {
          const legacyHistory = await apiFetch(`/chat/${listing.id}`).catch(() => []);
          if (isMounted) setMessages(legacyHistory);
        }

        const wsUrl = getWebSocketUrl(convId, token);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
          if (isMounted) {
            setWsStatus('connected');
            setError('');
          }
        };

        socket.onmessage = (event) => {
          try {
            const newMsg = JSON.parse(event.data);
            if (isMounted) {
              setMessages((prev) => {
                if (newMsg.id && prev.some(m => m.id === newMsg.id)) {
                  return prev;
                }
                return [...prev, newMsg];
              });
              if (convId) {
                clearAppNotifications(convId);
              }
            }
          } catch (e) {
            console.error("Error parsing message", e);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
          if (isMounted) {
            setWsStatus('error');
            setError('Connection issue. Retrying...');
          }
        };

        socket.onclose = (event) => {
          if (isMounted) {
            setWsStatus('disconnected');
          }
        };

      } catch (err) {
        console.error("Error in chat initialization:", err);
        if (isMounted) {
          setWsStatus('error');
          setError(err.message || 'Failed to initialize chat');
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [listing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const payload = {
      text: inputValue.trim(),
      recipient_id: listing.seller_id
    };

    ws.current.send(JSON.stringify(payload));
    setInputValue('');

    // User responded: clear native notifications & mark read
    const activeConvId = conversationId || listing.conversation_id;
    if (activeConvId) {
      clearAppNotifications(activeConvId);
    }
  };

  const handleProposeDropzone = (dz) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const msgText = `PROPOSAL:DROPZONE:${dz.id}:${dz.name}`;
    ws.current.send(JSON.stringify({
      text: msgText,
      recipient_id: listing.seller_id
    }));
    setShowDropzonePicker(false);
  };

  const handleAcceptDropzone = (dzName) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const msgText = `AGREED:DROPZONE:${dzName}`;
    ws.current.send(JSON.stringify({
      text: msgText,
      recipient_id: listing.seller_id
    }));
  };

  if (!isOpen || !listing) return null;

  const peerName = (activeItem?.seller_handle || listing?.seller_handle)
    ? (activeItem?.seller_handle || listing?.seller_handle).split('@').pop()
    : 'Campus Peer';

  const campusAcronym = activeItem?.campus_acronym || listing?.campus_acronym || 'LCU';

  // Accurate Nigerian Naira formatting matching Dashboard and ItemDetailModal
  const getFormattedPrice = () => {
    if (!activeItem) return '';
    
    // 1. If it's a request chat where budget was entered directly in Naira
    if (activeItem.is_request_chat) {
      const budget = activeItem.price !== undefined ? Number(activeItem.price) : (activeItem.budget_naira || 0);
      return budget ? budget.toLocaleString(undefined, { maximumFractionDigits: (budget % 1 === 0 ? 0 : 2) }) : '';
    }

    // 2. Database listings: price_kobo / 100
    if (activeItem.price_kobo !== undefined && activeItem.price_kobo !== null) {
      const naira = activeItem.price_kobo / 100;
      return naira.toLocaleString(undefined, { maximumFractionDigits: (naira % 1 === 0 ? 0 : 2) });
    }

    // 3. Fallback: if price is provided and stored in kobo (values >= 1000 in DB)
    if (activeItem.price !== undefined && activeItem.price !== null) {
      const num = Number(activeItem.price);
      const naira = num >= 1000 ? (num / 100) : num;
      return naira.toLocaleString(undefined, { maximumFractionDigits: (naira % 1 === 0 ? 0 : 2) });
    }

    return '';
  };

  const priceFormatted = getFormattedPrice();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content animate-fade-in chat-modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
      >
        {/* ============================================================== */}
        {/* HEADER: BACK, TITLE, STATUS & PEER AVATAR                      */}
        {/* ============================================================== */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {/* Back Button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: '0.85rem' }} /> Back
          </button>

          {/* Centered Messages & Peer info */}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              fontWeight: '600',
              margin: 0,
              color: 'var(--text-main)'
            }}>
              Messages
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              marginTop: '1px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: wsStatus === 'connected' ? '#10B981' : '#F59E0B'
              }} />
              <span>{peerName} ({campusAcronym})</span>
            </div>
          </div>

          {/* Peer Avatar */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-alt)',
            border: '2px solid var(--border)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--terracotta)',
            fontWeight: '700',
            fontSize: '0.95rem',
            overflow: 'hidden'
          }}>
            {listing.seller_avatar ? (
              <img 
                src={getImageUrl(listing.seller_avatar)} 
                alt={peerName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              peerName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONTEXT ITEM CARD (Click to View Item Details)                 */}
        {/* ============================================================== */}
        <div 
          onClick={handleOpenItemDetail}
          style={{
            padding: '0.65rem 1.15rem',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0,
            cursor: activeItem?.is_request_chat ? 'default' : 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title={activeItem?.is_request_chat ? 'Wanted Request' : 'Click to inspect item details'}
          className="chat-context-item-card"
        >
          {/* Item thumbnail */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {(activeItem?.image_url || listing?.image_url) ? (
              <img 
                src={getImageUrl(activeItem?.image_url || listing?.image_url)} 
                alt={activeItem?.title || listing?.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <i className="fa-regular fa-image" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{
                fontWeight: '700',
                fontSize: '0.92rem',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeItem?.title || listing?.title}
              </span>
              {priceFormatted ? (
                <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--terracotta)', marginLeft: '0.5rem', flexShrink: 0 }}>
                  ₦{priceFormatted}
                </span>
              ) : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeItem?.is_request_chat ? 'Wanted Request' : 'Tap to inspect item'}
              </span>
              {!activeItem?.is_request_chat && (
                <span style={{ fontSize: '0.74rem', color: 'var(--terracotta)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span>View</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SAFETY NOTICE CARD                                             */}
        {/* ============================================================== */}
        <div style={{
          margin: '0.65rem 1.15rem 0.25rem 1.15rem',
          backgroundColor: 'var(--surface-alt)',
          borderRadius: '14px',
          padding: '0.65rem 0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem',
          color: 'var(--text-main)',
          lineHeight: '1.4',
          border: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <span>🤝</span>
          <span>Safest to meet in busy areas like the {campusAcronym} Cafeteria or Library.</span>
        </div>

        {/* Dropzone Selection Tray */}
        {showDropzonePicker && (
          <div style={{
            margin: '0.5rem 1.15rem',
            padding: '0.75rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--terracotta)' }}>
                📍 Propose a Safe Meetup Spot:
              </span>
              <button 
                onClick={() => setShowDropzonePicker(false)}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto' }}>
              {dropzones.map(dz => (
                <button
                  key={dz.id}
                  onClick={() => handleProposeDropzone(dz)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  📍 {dz.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MESSAGE BUBBLES STREAM                                         */}
        {/* ============================================================== */}
        <div style={{
          flex: 1,
          padding: '0.85rem 1.15rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', padding: '1.5rem' }}>
              <i className="fa-regular fa-comment-dots" style={{ fontSize: '2.2rem', color: 'var(--terracotta)', opacity: 0.5, marginBottom: '0.5rem', display: 'block' }} />
              <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>Start Conversation</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: 0 }}>
                Ask if the item is still available or arrange a quick meetup!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const msgText = msg.text || msg.content || '';
              const isMine = msg.sender_id ? (currentUserId && msg.sender_id === currentUserId) : false;
              const isProposal = msgText.startsWith('PROPOSAL:DROPZONE:');
              const isAgreement = msgText.startsWith('AGREED:DROPZONE:');

              if (isProposal) {
                const parts = msgText.split(':');
                const dzName = parts.slice(3).join(':') || 'Campus Location';
                return (
                  <div key={msg.id || index} style={{
                    alignSelf: 'center',
                    maxWidth: '90%',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--terracotta)', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                      📍 PROPOSED MEETUP SPOT
                    </p>
                    <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                      {dzName}
                    </p>
                    {!isMine && (
                      <button
                        onClick={() => handleAcceptDropzone(dzName)}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', borderRadius: '9999px' }}
                      >
                        Accept Spot
                      </button>
                    )}
                  </div>
                );
              }

              if (isAgreement) {
                const dzName = msgText.replace('AGREED:DROPZONE:', '');
                return (
                  <div key={msg.id || index} style={{
                    alignSelf: 'center',
                    backgroundColor: 'var(--badge-active-bg)',
                    borderRadius: '9999px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: 'var(--badge-active-text)'
                  }}>
                    ✓ Meetup Agreed: {dzName}
                  </div>
                );
              }

              return (
                <div 
                  key={msg.id || index} 
                  style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}
                >
                  <div style={{
                    padding: '0.7rem 1rem',
                    borderRadius: '18px',
                    backgroundColor: isMine ? 'var(--terracotta)' : 'var(--surface-alt)',
                    color: isMine ? '#FFFFFF' : 'var(--text-main)',
                    border: isMine ? 'none' : '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.9rem',
                    lineHeight: '1.45',
                    wordBreak: 'break-word'
                  }}>
                    {msgText}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================== */}
        {/* INPUT BAR: (+) BUTTON, PILL INPUT, AND SEND BUTTON             */}
        {/* ============================================================== */}
        <form 
          onSubmit={handleSend}
          style={{
            padding: '0.75rem 1.15rem 1.15rem 1.15rem',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            flexShrink: 0
          }}
        >
          {/* Plus button for meetup dropzones */}
          <button
            type="button"
            onClick={() => setShowDropzonePicker(prev => !prev)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              flexShrink: 0
            }}
            title="Propose Meetup Spot"
          >
            <i className="fa-solid fa-plus" />
          </button>

          {/* Pill input */}
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message..."
            style={{
              flex: 1,
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: '9999px',
              padding: '0.65rem 1.15rem',
              fontSize: '0.92rem',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-main)',
              outline: 'none'
            }}
          />

          {/* Terracotta Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: inputValue.trim() ? 'var(--terracotta)' : 'var(--surface-pill)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputValue.trim() ? 'pointer' : 'default',
              fontSize: '0.9rem',
              flexShrink: 0,
              boxShadow: inputValue.trim() ? '0 2px 8px rgba(200, 122, 91, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="fa-solid fa-paper-plane" style={{ transform: 'translateX(-1px)' }} />
          </button>
        </form>

      </div>

      {/* Item Detail Modal overlay inside Chat */}
      {showItemDetail && detailItem && (
        <ItemDetailModal
          isOpen={true}
          listing={detailItem}
          onClose={() => setShowItemDetail(false)}
          onMessageSeller={() => setShowItemDetail(false)}
          currentUserId={currentUserId}
          zIndex={1300}
        />
      )}
    </div>
  );
}

export default ChatModal;
