import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const CATEGORIES = [
  'Textbooks',
  'Electronics',
  'Dorm Essentials',
  'Fashion & Apparel',
  'Other'
];

function EditListingModal({ isOpen, onClose, listing, onUpdated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [status, setStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPrice(listing.price_kobo ? (listing.price_kobo / 100).toString() : (listing.price || '').toString());
      setCategory(listing.category || 'Textbooks');
      setStatus(listing.status || 'active');
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || priceFloat < 0) {
        throw new Error('Please enter a valid price in Naira.');
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: priceFloat, price_kobo: Math.round(priceFloat * 100),
        category: category,
        status: status
      };

      await apiFetch(`/listings/${listing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '540px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge-pill" style={{ marginBottom: '0.4rem' }}>
              <i className="fa-solid fa-pen-to-square" /> Seller Control
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Edit Listing
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--surface-alt)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

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
            <label className="form-label">Item Title</label>
            <input 
              className="form-input"
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Category</label>
              <select 
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ cursor: 'pointer', backgroundColor: 'var(--surface)' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Price (NGN)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--brandgreen)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}>
                  ₦
                </span>
                <input 
                  className="form-input"
                  type="number" 
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Listing Status</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStatus('active')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: status === 'active' ? 'var(--brandgreen)' : 'var(--border)',
                  backgroundColor: status === 'active' ? 'var(--lightgreen)' : '#ffffff',
                  color: status === 'active' ? 'var(--darkgreen)' : 'var(--text-muted)',
                  fontWeight: status === 'active' ? '700' : '500',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-store" /> Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('sold')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: status === 'sold' ? '#e07a5f' : 'var(--border)',
                  backgroundColor: status === 'sold' ? '#fdf2f0' : '#ffffff',
                  color: status === 'sold' ? '#c04e30' : 'var(--text-muted)',
                  fontWeight: status === 'sold' ? '700' : '500',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-solid fa-circle-check" /> Sold
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Description & Condition</label>
            <textarea 
              className="form-input"
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about condition..."
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditListingModal;
