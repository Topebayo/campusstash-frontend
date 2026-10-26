import React, { useState, useEffect } from 'react';
import { apiFetch, getImageUrl } from '../api';

const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

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

  // Photo 1 state
  const [currentCoverUrl, setCurrentCoverUrl] = useState('');
  const [newImage1, setNewImage1] = useState(null);
  const [newImage1Preview, setNewImage1Preview] = useState(null);

  // Photo 2 state
  const [currentDetailUrl, setCurrentDetailUrl] = useState('');
  const [newImage2, setNewImage2] = useState(null);
  const [newImage2Preview, setNewImage2Preview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      const rawKobo = listing.price_kobo !== undefined && listing.price_kobo !== null ? listing.price_kobo : listing.price;
      setPrice(rawKobo ? (rawKobo / 100).toString() : '0');
      setCategory(listing.category || 'Textbooks');
      setStatus(listing.status || 'active');

      setCurrentCoverUrl(listing.image_url || '');

      // Check secondary image in listing.images
      let detailUrl = '';
      if (Array.isArray(listing.images)) {
        const secondary = listing.images.find(img => {
          const u = typeof img === 'string' ? img : img?.image_url;
          return u && u !== listing.image_url;
        });
        if (secondary) {
          detailUrl = typeof secondary === 'string' ? secondary : secondary.image_url;
        }
      }
      setCurrentDetailUrl(detailUrl);
      setNewImage1(null);
      setNewImage1Preview(null);
      setNewImage2(null);
      setNewImage2Preview(null);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleImage1Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage1(file);
      setNewImage1Preview(URL.createObjectURL(file));
    }
  };

  const handleImage2Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage2(file);
      setNewImage2Preview(URL.createObjectURL(file));
    }
  };

  const clearPhoto1 = (e) => {
    e.stopPropagation();
    if (newImage1Preview) URL.revokeObjectURL(newImage1Preview);
    setNewImage1(null);
    setNewImage1Preview(null);
    setCurrentCoverUrl('');
  };

  const clearPhoto2 = (e) => {
    e.stopPropagation();
    if (newImage2Preview) URL.revokeObjectURL(newImage2Preview);
    setNewImage2(null);
    setNewImage2Preview(null);
    setCurrentDetailUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || priceFloat < 0) {
        throw new Error('Please enter a valid price in Naira.');
      }

      // Resolve Photo 1
      let updatedCoverUrl = currentCoverUrl;
      if (newImage1) {
        try {
          const comp1 = await compressImage(newImage1);
          if (comp1) updatedCoverUrl = comp1;
        } catch (e) {
          console.warn('Image 1 compression note:', e);
        }
      }

      // Resolve Photo 2
      let updatedDetailUrl = currentDetailUrl;
      if (newImage2) {
        try {
          const comp2 = await compressImage(newImage2);
          if (comp2) updatedDetailUrl = comp2;
        } catch (e) {
          console.warn('Image 2 compression note:', e);
        }
      }

      const allImagesList = [];
      if (updatedCoverUrl) allImagesList.push(updatedCoverUrl);
      if (updatedDetailUrl && updatedDetailUrl !== updatedCoverUrl) allImagesList.push(updatedDetailUrl);

      const priceKobo = Math.round(priceFloat * 100);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: priceKobo,
        price_kobo: priceKobo,
        category: category,
        status: status,
        image_url: updatedCoverUrl || null,
        images: allImagesList
      };

      await apiFetch(/listings/, {
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

  const displayCover = newImage1Preview || (currentCoverUrl ? getImageUrl(currentCoverUrl) : null);
  const displayDetail = newImage2Preview || (currentDetailUrl ? getImageUrl(currentDetailUrl) : null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '560px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
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
              placeholder="Item title"
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
                  ?
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
            <label className="form-label">Market Status</label>
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

          {/* Dual Photo Management */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Item Photos (Up to 2)</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cover + Detail Angle</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {/* Photo 1: Cover Photo */}
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                height: '130px',
                backgroundColor: 'var(--bg-color)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                {displayCover ? (
                  <>
                    <img 
                      src={displayCover} 
                      alt="Cover Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.35rem',
                      left: '0.35rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      padding: '0.2rem 0.45rem',
                      borderRadius: '6px'
                    }}>
                      Cover
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto1}
                      title="Remove image"
                      style={{
                        position: 'absolute',
                        top: '0.35rem',
                        right: '0.35rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </>
                ) : (
                  <>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImage1Change}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0.5rem', textAlign: 'center' }}>
                      <i className="fa-solid fa-camera" style={{ fontSize: '1.3rem', color: 'var(--brandgreen)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        Photo 1 (Cover)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        Front view
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Photo 2: Detail / Back Photo */}
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                height: '130px',
                backgroundColor: 'var(--bg-color)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                {displayDetail ? (
                  <>
                    <img 
                      src={displayDetail} 
                      alt="Detail Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: '0.35rem',
                      left: '0.35rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#fff',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      padding: '0.2rem 0.45rem',
                      borderRadius: '6px'
                    }}>
                      Detail
                    </div>
                    <button
                      type="button"
                      onClick={clearPhoto2}
                      title="Remove image"
                      style={{
                        position: 'absolute',
                        top: '0.35rem',
                        right: '0.35rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </>
                ) : (
                  <>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImage2Change}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0.5rem', textAlign: 'center' }}>
                      <i className="fa-solid fa-plus" style={{ fontSize: '1.3rem', color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        Photo 2 (Optional)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        Back or detail
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
