import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      paddingBottom: '4rem'
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: 'var(--surface-header)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Go back"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎓</span>
            <span style={{ fontWeight: '800', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
              CampusStash Legal
            </span>
          </div>
        </div>
        <ThemeToggleBtn />
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '1.5rem 1.25rem'
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            marginBottom: '0.35rem',
            color: 'var(--text-main)'
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Effective Date: November 13, 2026 • Version 1.2.0
          </p>

          <section style={{ marginBottom: '1.5rem', lineHeight: '1.65', fontSize: '0.92rem' }}>
            <p>
              Welcome to <strong>CampusStash</strong> ("we", "our", or "us"). CampusStash is a dedicated peer-to-peer campus marketplace designed exclusively for tertiary students in Nigeria. We are deeply committed to protecting your personal information and your privacy rights under applicable data protection laws, including the Nigeria Data Protection Act (NDPA), GDPR guidelines, and Apple & Google platform standards.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              1. Information We Collect
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
              We collect information that you directly provide when registering and using the platform:
            </p>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <li><strong>Account Credentials:</strong> Full name, institutional or personal email address, encrypted password, and campus affiliation.</li>
              <li><strong>Contact Information:</strong> Phone number and optional WhatsApp contact for seller communication and OTP authentication.</li>
              <li><strong>Listing Data:</strong> Titles, descriptions, categories, pricing, and item photographs uploaded for sale.</li>
              <li><strong>Store & KYC Verification Data:</strong> For registered campus stores, business name, service specialties, and student matriculation proof for buyer safety.</li>
              <li><strong>Messages:</strong> Encrypted in-app chat conversations exchanged between student buyers and sellers.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              2. How We Use Your Information
            </h2>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <li>To provide, personalize, and improve our campus marketplace experience.</li>
              <li>To verify student identity and prevent fraudulent listings and scams.</li>
              <li>To facilitate safe on-campus meetups and direct communication between buyers and sellers.</li>
              <li>To send critical account notifications (order updates, security alerts, and OTP codes).</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              3. Data Sharing & Third Parties
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <strong>We do not sell, rent, or trade your personal data.</strong> Your information is only shared with trusted infrastructure providers required to operate the service:
            </p>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6', marginTop: '0.4rem' }}>
              <li><strong>Hosting & Database:</strong> Supabase and Railway for encrypted cloud storage.</li>
              <li><strong>Image Storage:</strong> Cloudinary for optimized media delivery.</li>
              <li><strong>Campus Community:</strong> Public listing details and store profiles are visible to fellow students on your campus.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              4. Camera and Storage Permissions (Mobile Apps)
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              Our mobile apps on Android and iOS may request permission to access your camera and photo library. These permissions are strictly used when you actively choose to take a photo or upload product images for your marketplace listings. You can revoke these permissions at any time in your device settings.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              5. Account Deletion & Data Retention
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              In full compliance with Apple App Store Guideline 5.1.1(v) and Google Play policies, <strong>you can delete your account at any time directly inside the app</strong>:
            </p>
            <div style={{
              backgroundColor: 'var(--surface-alt)',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              margin: '0.75rem 0',
              fontSize: '0.88rem'
            }}>
              Go to <strong>Profile ➔ Settings (Gear icon) ➔ Danger Zone: Delete Account</strong>.
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
              Upon deletion, your profile, active listings, reviews, and private messages are immediately and permanently wiped from our production databases.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              6. Contact Us
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              If you have any questions or data requests regarding this Privacy Policy, please contact our Data Protection team:
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.4rem' }}>
              Email: <a href="mailto:privacy@campusstash.com.ng" style={{ color: 'var(--primary)' }}>privacy@campusstash.com.ng</a>
              <br />
              Support: <a href="mailto:support@campusstash.com.ng" style={{ color: 'var(--primary)' }}>support@campusstash.com.ng</a>
              <br />
              Website: <a href="https://www.campusstash.com.ng" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>www.campusstash.com.ng</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

