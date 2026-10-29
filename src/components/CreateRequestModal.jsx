import React, { useState, useEffect } from 'react';
import { createItemRequest, getCampuses, getActiveCampusId } from '../api';

function CreateRequestModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [campusId, setCampusId] = useState('');
  const [campuses, setCampuses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      getCampuses().then(data => {
        if (Array.isArray(data)) {
          setCampuses(data);
          const active = getActiveCampusId();
          if (active) {
            setCampusId(active);
          } else if (data.length > 0) {
            setCampusId(data[0].id);
          }
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      let budgetNum = null;
      if (budget.trim()) {
        const parsed = parseFloat(budget);
        if (!isNaN(parsed) && parsed > 0) {
          budgetNum = parsed;
        }
      }

      await createItemRequest({
        title: title.trim(),
        budget: budgetNum,
        description: description.trim() || null,
        campus_id: campusId || null
      });

      setTitle('');
      setBudget('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge-pill" style={{ marginBottom: '0.4rem', backgroundColor: '#fef3c7', color: '#b45309' }}>
              <i className="fa-solid fa-magnifying-glass" /> Wanted Board
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Looking for Something?
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Post what you need. Classmates with matching items can reach out directly.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--surface-alt)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
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

        {error && (
          <div style={{
            color: '#b91c1c',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">What item do you need?</label>
            <input 
              className="form-input"
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus MAT 111 Textbook, Small Bedside Fan, Scientific fx-991"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="form-label">Campus</label>
              <select 
                className="form-input"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                style={{ cursor: 'pointer', backgroundColor: 'var(--surface)' }}
              >
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.acronym} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Your Budget (NGN)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--brandgreen)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '700',
                  fontSize: '0.95rem'
                }}>
                  {'\u20A6'}
                </span>
                <input 
                  className="form-input"
                  type="number" 
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 5,000 (Optional)"
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Specific Details / Urgency</label>
            <textarea 
              className="form-input"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Needed for semester exams, willing to meet at Queen Idia Hall or Faculty of Science..."
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.4rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bullhorn" />
                  Post Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRequestModal;
