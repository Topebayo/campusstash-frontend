import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [burnerHandle, setBurnerHandle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        const data = await apiFetch('/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });

        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        if (!phone.trim()) {
          setError('Phone number is required.');
          setIsLoading(false);
          return;
        }

        const payload = {
          email: email.trim(),
          password,
          phone: phone.trim(),
          profile: { burner_handle: burnerHandle.trim() }
        };

        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const formData = new FormData();
        formData.append('username', email.trim());
        formData.append('password', password);

        const data = await apiFetch('/auth/login/access-token', {
          method: 'POST',
          body: formData,
        });

        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-color)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.25rem',
      position: 'relative'
    }}>
      
      {/* Top Header Back Button */}
      <div style={{
        position: 'absolute',
        top: '1.25rem',
        left: '1.25rem',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--darkgreen)',
            fontFamily: 'var(--font-display)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Brand Header */}
      <div 
        onClick={() => navigate('/dashboard')} 
        style={{ cursor: 'pointer', marginBottom: '1.75rem', textAlign: 'center', marginTop: '1.5rem' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: '800',
          fontSize: '2.2rem',
          letterSpacing: '-0.03em',
          color: 'var(--text-main)',
          marginBottom: '0.35rem'
        }}>
          Campus<span className="text-brandgreen">Stash</span>
        </div>
        <span className="badge-pill">
          <i className="fa-solid fa-lock" /> Masked Student Commerce
        </span>
      </div>

      {/* Auth Card */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '2.25rem 1.75rem',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06)'
      }}>
        
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '12px',
          padding: '0.3rem',
          marginBottom: '1.75rem',
          border: '1px solid var(--border)'
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: isLogin ? '#ffffff' : 'transparent',
              color: isLogin ? 'var(--darkgreen)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: isLogin ? '700' : '500',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: !isLogin ? '#ffffff' : 'transparent',
              color: !isLogin ? 'var(--darkgreen)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: !isLogin ? '700' : '500',
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
          marginBottom: '0.4rem',
          textAlign: 'center'
        }}>
          {isLogin ? 'Welcome Back!' : 'Create Burner Profile'}
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {isLogin 
            ? 'Sign in to contact sellers and manage your campus listings.' 
            : 'Get an anonymous handle to buy and sell securely.'}
        </p>

        {error && (
          <div style={{
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label className="form-label">Email Address</label>
            <input 
              className="form-input"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@university.edu"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input 
              className="form-input"
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="form-label">Phone Number (Required for SMS verification)</label>
                <input 
                  className="form-input"
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 800 000 0000"
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
                    value={burnerHandle}
                    onChange={(e) => setBurnerHandle(e.target.value)}
                    placeholder="e.g. shadow_trader"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" />
                Processing...
              </>
            ) : (
              isLogin ? 'Log In to CampusStash' : 'Create Student Account'
            )}
          </button>
        </form>

        {/* Skip & Browse Guest Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.1rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brandgreen)',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>Browse Items as Guest</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;
