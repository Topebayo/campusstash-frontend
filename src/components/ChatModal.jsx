import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, getWebSocketUrl } from '../api';
import { Capacitor } from '@capacitor/core';

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

        // 1. Use existing conversation ID if available (e.g. from Inbox/Messages), or create/retrieve for listing
        let convId = listing.conversation_id;
        if (!convId) {
          const conv = await apiFetch('/conversations/', {
            method: 'POST',
            body: JSON.stringify({
              listing_id: listing.id,
              recipient_id: listing.seller_id
            })
          });
          convId = conv.id;
        }

        if (!isMounted) return;
        setConversationId(convId);

        // 2. Fetch history messages for this conversation
        try {
          const historyData = await apiFetch(`/conversations/${convId}/messages`);
          if (isMounted) {
            setMessages(historyData.items || historyData || []);
          }
        } catch (hErr) {
          // Fallback to legacy chat history endpoint if needed
          const legacyHistory = await apiFetch(`/chat/${listing.id}`).catch(() => []);
          if (isMounted) setMessages(legacyHistory);
        }

        // 3. Connect WebSocket using conversation ID
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
              if (newMsg.sender_id && currentUserId && newMsg.sender_id !== currentUserId) {
                try {
                  const AudioContext = window.AudioContext || window.webkitAudioContext;
                  if (AudioContext) {
                    const ctx = new AudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.32);
                  }
                } catch (e) {}
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
            if (event.code === 1008) {
              setError('Session expired. Please log in again.');
            }
          }
        };

      } catch (err) {
        console.error("Failed to initialize conversation", err);
        if (isMounted) {
          setWsStatus('error');
          setError(err.message || 'Failed to start chat session');
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
  }, [isOpen, listing]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!listing) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || wsStatus !== 'connected' || !ws.current) return;

    const payload = {
      text: inputValue.trim(),
      message: inputValue.trim(),
      listing_id: listing.id
    };

    ws.current.send(JSON.stringify(payload));
    setInputValue('');
  };

  const handleProposeDropzone = (dz) => {
    if (wsStatus !== 'connected' || !ws.current) return;
    const proposalText = `PROPOSAL:DROPZONE:${dz.id}:${dz.name}`;
    ws.current.send(JSON.stringify({
      text: proposalText,
      message: proposalText,
      listing_id: listing.id
    }));
    setShowDropzonePicker(false);
  };

  const handleAcceptDropzone = (dzName) => {
    if (wsStatus !== 'connected' || !ws.current) return;
    const acceptText = `AGREED:DROPZONE:${dzName}`;
    ws.current.send(JSON.stringify({
      text: acceptText,
      message: acceptText,
      listing_id: listing.id
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          maxWidth: '520px',
          width: '92%',
          height: '84vh',
          maxHeight: '680px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#ef4444'
            }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                {listing.title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {wsStatus === 'connected' ? 'Connected securely' : wsStatus === 'connecting' ? 'Connecting to peer...' : 'Offline'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setShowDropzonePicker(!showDropzonePicker)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                backgroundColor: showDropzonePicker ? 'var(--lightgreen)' : 'var(--bg-color)',
                color: 'var(--darkgreen)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <i className="fa-solid fa-location-dot" />
              Meetup Spot
            </button>
            <button 
              onClick={onClose}
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
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Dropzone Selection Tray */}
        {showDropzonePicker && (
          <div style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--surface-alt)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--darkgreen)', letterSpacing: '0.04em' }}>
                <i className="fa-solid fa-shield-halved" /> SELECT SAFE CAMPUS DROPZONE
              </span>
              <button 
                onClick={() => setShowDropzonePicker(false)}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', maxHeight: '140px', overflowY: 'auto' }}>
              {dropzones.map(dz => (
                <button
                  key={dz.id}
                  onClick={() => handleProposeDropzone(dz)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(16,185,129,0.3)',
                    backgroundColor: 'var(--surface)',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '600',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--brandgreen)' }} />
                  {dz.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '0.6rem 1rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fa-solid fa-triangle-exclamation" />
            {error}
          </div>
        )}

        {/* Message Log */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: 'var(--bg-color)'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', padding: '2rem' }}>
              <i className="fa-regular fa-comments" style={{ fontSize: '2.5rem', color: 'var(--brandgreen)', marginBottom: '0.75rem', display: 'block' }} />
              <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: '0 0 0.4rem 0' }}>No messages yet</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', margin: 0 }}>
                Say hello or propose a safe campus meetup spot using the button above!
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
                    border: '1.5px solid var(--brandgreen)',
                    borderRadius: '16px',
                    padding: '0.85rem 1.1rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--darkgreen)', fontWeight: '700', margin: '0 0 0.4rem 0' }}>
                      ðŸ“ PROPOSED MEETUP SPOT
                    </p>
                    <p style={{ fontSize: '0.95rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
                      {dzName}
                    </p>
                    {!isMine && (
                      <button
                        onClick={() => handleAcceptDropzone(dzName)}
                        className="btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '20px' }}
                      >
                        <i className="fa-solid fa-check" /> Accept Spot
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
                    maxWidth: '90%',
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: '16px',
                    padding: '0.75rem 1.1rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--darkgreen)', fontWeight: '800', margin: 0 }}>
                      âœ… MEETUP SPOT AGREED: {dzName}
                    </p>
                  </div>
                );
              }

              return (
                <div 
                  key={msg.id || index} 
                  style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{
                    padding: '0.7rem 1.1rem',
                    borderRadius: '18px',
                    borderBottomRightRadius: isMine ? '4px' : '18px',
                    borderBottomLeftRadius: isMine ? '18px' : '4px',
                    backgroundColor: isMine ? 'var(--brandblue)' : 'var(--surface)',
                    color: isMine ? '#ffffff' : 'var(--text-main)',
                    border: isMine ? 'none' : '1px solid var(--border)',
                    boxShadow: isMine ? 'var(--shadow-blue)' : 'var(--shadow-sm)',
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

        {/* Input Form Footer - Fixed Responsive Send Button */}
        <form 
          onSubmit={handleSend} 
          style={{
            padding: '0.85rem 1.1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: 'var(--surface)',
            boxSizing: 'border-box',
            width: '100%'
          }}
        >
          <input 
            type="text" 
            placeholder={wsStatus === 'connected' ? "Type a message..." : "Connecting to chat..."} 
            value={inputValue}
            disabled={wsStatus !== 'connected'}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.72rem 1.1rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--brandgreen)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            style={{
              flexShrink: 0,
              borderRadius: '9999px',
              padding: '0.72rem 1.25rem',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }} 
            disabled={!inputValue.trim() || wsStatus !== 'connected'}
          >
            <i className="fa-solid fa-paper-plane" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatModal;

