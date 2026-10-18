import React from 'react';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();

  const dummyProducts = [
    {
      id: 1,
      name: "Engineering Mathematics 7th Ed",
      tag: "Textbooks",
      price: "₦ 12,000",
      colors: ["#2d332a", "#a3a89f", "#e07a5f"]
    },
    {
      id: 2,
      name: "Casio Scientific Calculator fx-991EX",
      tag: "Electronics",
      price: "₦ 8,500",
      colors: ["#143528", "#d6d3c9"]
    },
    {
      id: 3,
      name: "Standard Drafting Board",
      tag: "Supplies",
      price: "₦ 5,400",
      colors: ["#e07a5f", "#f5f4ef", "#0a1b14"]
    },
    {
      id: 4,
      name: "Modern Dorm Reading Lamp",
      tag: "Essentials",
      price: "₦ 4,200",
      colors: ["#e9f2eb", "#6b7067"]
    }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', overflowX: 'hidden', padding: '1rem' }}>
      {/* Hero Section */}
      <div className="hero-container" style={{
        position: 'relative',
        width: '100%',
        height: '85vh',
        minHeight: '600px',
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundImage: 'url("/hero_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Overlay for better text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(10, 27, 20, 0.7) 0%, rgba(10, 27, 20, 0.1) 100%)',
          zIndex: 1
        }} />

        {/* Navbar */}
        <nav className="landing-nav">
          <div 
            onClick={() => navigate('/')} 
            className="landing-logo"
          >
            Campus<span style={{ color: 'var(--lightgreen)' }}>Stash</span>
          </div>
          
          <div className="landing-nav-links">
            <span onClick={() => navigate('/dashboard')}>Shop</span>
            <span onClick={() => navigate('/dashboard')}>Bestsellers</span>
            <span onClick={() => navigate('/auth')}>Account</span>
          </div>

          <div className="landing-nav-actions">
            <button className="landing-cta-btn" onClick={() => navigate('/dashboard')}>
              <i className="fa-solid fa-store"></i>
              <span>Marketplace</span>
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 'auto',
          marginBottom: 'auto',
          maxWidth: '650px',
          color: '#ffffff'
        }}>
          <h1 className="hero-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3.5rem, 7vw, 5rem)',
            fontWeight: '600',
            lineHeight: '1.05',
            marginBottom: '1.5rem',
            letterSpacing: '-0.03em'
          }}>
            Campus Essentials<br />
            <span style={{ fontStyle: 'italic', fontWeight: '400', color: 'var(--lightgreen)' }}>for a smarter</span> dorm
          </h1>
          
          <p className="hero-subtitle" style={{ fontSize: '1.15rem', opacity: 0.95, marginBottom: '2.5rem', maxWidth: '450px', lineHeight: '1.6' }}>
            The 100% anonymous marketplace for university students. Buy, sell, and trade safely on your campus.
          </p>

          <button 
            style={{
              background: 'var(--lightgreen)',
              color: 'var(--brandgreen)',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '30px',
              fontWeight: '700',
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'transform 0.2s',
            }}
            onClick={() => navigate('/dashboard')}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Shop now <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>

        {/* Floating Stat Card */}
        <div className="stat-card" style={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          zIndex: 2,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '20px',
          padding: '1.75rem',
          color: '#ffffff',
          width: '260px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', opacity: 0.95 }}>
            <span style={{ fontSize: '0.95rem', lineHeight: '1.5', fontWeight: '500' }}>Anonymous.<br/>Secure.<br/>Campus-first.</span>
            <i className="fa-solid fa-leaf" style={{ fontSize: '1.2rem', color: 'var(--lightgreen)' }}></i>
          </div>
          <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', fontWeight: '500', color: 'var(--lightgreen)' }}>100%</div>
        </div>
      </div>

      {/* Main Section */}
      <main style={{ maxWidth: '1400px', margin: '5rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '500', color: 'var(--text-muted)' }}>
              Top Deals Campus-Wide
            </h2>
            <h3 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
              Bestselling <span style={{ fontStyle: 'italic', fontWeight: '400' }}>Essentials</span>
            </h3>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', borderBottom: '1.5px solid var(--text-main)', paddingBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/dashboard')}>
            More products <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }}></i>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {dummyProducts.map((product) => (
            <div key={product.id} style={{
              background: 'var(--surface)',
              borderRadius: '24px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            onClick={() => navigate('/dashboard')}
            >
              {/* Product Image Area */}
              <div style={{
                width: '100%',
                height: '280px',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '20px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-muted)'
                }}>
                  {product.tag}
                </span>
                {/* Abstract graphic representing product since we lack images */}
                <div style={{ opacity: 0.1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <i className="fa-solid fa-cube" style={{ fontSize: '4rem', color: 'var(--brandgreen)' }}></i>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {product.colors.map((c, i) => (
                  <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c }} />
                ))}
              </div>

              <h4 style={{ fontSize: '1.15rem', fontWeight: '500', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                {product.name}
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-main)' }}>
                  {product.price}
                </span>
                <button style={{
                  background: 'var(--brandgreen)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--brandgreen-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--brandgreen)'}
                >
                  <i className="fa-solid fa-plus"></i> Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Global Modern Web Footer */}
      <Footer />
    </div>
  );
}

export default Landing;
