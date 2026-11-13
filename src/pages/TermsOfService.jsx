import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleBtn from '../components/ThemeToggleBtn';

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Effective Date: November 13, 2026 • Version 1.2.0
          </p>

          <section style={{ marginBottom: '1.5rem', lineHeight: '1.65', fontSize: '0.92rem' }}>
            <p>
              By accessing or using <strong>CampusStash</strong> ("the Platform"), available on the web, Android, and iOS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              1. Eligibility & Campus Community
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              CampusStash is designed primarily for registered students, faculty, and authorized vendors within recognized Nigerian universities, polytechnics, and colleges. You agree to provide accurate information upon registration and maintain the security of your account credentials.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              2. Peer-to-Peer Marketplace & Safety
            </h2>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <li><strong>Physical Exchange & Safe Zones:</strong> Buyers and sellers are encouraged to conduct physical inspections and product handovers in public, designated campus zones (e.g. university libraries, cafeterias, campus gates).</li>
              <li><strong>Direct Seller Interaction:</strong> Buyers may communicate directly via in-app chat or verified WhatsApp links to negotiate, inspect, and complete item pickups.</li>
              <li><strong>Independent Transactions:</strong> CampusStash acts as a technology platform connecting campus peers; users are responsible for inspecting products before concluding transactions.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              3. Prohibited Items and Conduct
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.4rem' }}>
              The following items and behaviors are strictly forbidden on CampusStash:
            </p>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <li>Weapons, hazardous materials, or illegal substances.</li>
              <li>Stolen property or counterfeit merchandise.</li>
              <li>Academic malpractice materials (e.g. unauthorized exam question papers).</li>
              <li>Harassment, abusive messaging, or fraudulent misrepresentation of items.</li>
            </ul>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginTop: '0.5rem' }}>
              Violations will result in immediate listing removal and permanent account ban.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              4. Store Verification & Services
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              Campus store accounts that register services (e.g. hair styling, lash tech, gadget repairs, photography) agree to represent their skills truthfully, honor client appointments, and conduct campus business ethically.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              5. Termination
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              You may terminate your account at any time via the in-app account deletion tool. We reserve the right to suspend or terminate accounts that breach these terms or threaten campus safety.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
              6. Contact Information
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              Questions about these Terms should be sent to:
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.4rem' }}>
              Email: <a href="mailto:legal@campusstash.com.ng" style={{ color: 'var(--primary)' }}>legal@campusstash.com.ng</a>
              <br />
              Website: <a href="https://www.campusstash.com.ng" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>www.campusstash.com.ng</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
