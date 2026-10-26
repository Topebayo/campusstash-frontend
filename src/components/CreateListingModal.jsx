import React, { useState } from 'react';
import { apiFetch, getCampuses, getActiveCampusId } from '../api';

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

function CreateListingModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [campusId, setCampusId] = useState('');
  const [campuses, setCampuses] = useState([]);
  const [createdItem, setCreatedItem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [image1, setImage1] = useState(null);
  const [image1Preview, setImage1Preview] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image2Preview, setImage2Preview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setCreatedItem(null);
      setCopiedLink(false);
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

  const handleImage1Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage1(file);
      setImage1Preview(URL.createObjectURL(file));
    }
  };

  const handleImage2Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage2(file);
      setImage2Preview(URL.createObjectURL(file));
    }
  };

  const removeImage1 = (e) => {
    e.stopPropagation();
    if (image1Preview) URL.revokeObjectURL(image1Preview);
    setImage1(null);
    setImage1Preview(null);
  };

  const removeImage2 = (e) => {
    e.stopPropagation();
    if (image2Preview) URL.revokeObjectURL(image2Preview);
    setImage2(null);
    setImage2Preview(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Textbooks');
    if (image1Preview) URL.revokeObjectURL(image1Preview);
    if (image2Preview) URL.revokeObjectURL(image2Preview);
    setImage1(null);
    setImage1Preview(null);
    setImage2(null);
    setImage2Preview(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || priceFloat <= 0) {
        throw new Error('Please enter a valid positive price in Naira.');
      }
      
      const priceKobo = Math.round(priceFloat * 100);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price_kobo', priceKobo);
      formData.append('category', category);
      if (campusId) {
        formData.append('campus_id', campusId);
      }

      // Primary Image (Cover)
      if (image1) {
        let sentCompressed1 = false;
        try {
          const compressed1 = await compressImage(image1);
          if (compressed1) {
            formData.append('image_url', compressed1);
            sentCompressed1 = true;
          }
        } catch (e) {
          console.warn('Image 1 compression note:', e);
        }
        if (!sentCompressed1) {
          formData.append('image', image1);
        }
      }

      // Secondary Image (Detail / Back)
      if (image2) {
        let sentCompressed2 = false;
        try {
          const compressed2 = await compressImage(image2);
          if (compressed2) {
            formData.append('image_2_url', compressed2);
            sentCompressed2 = true;
          }
        } catch (e) {
          console.warn('Image 2 compression note:', e);
        }
        if (!sentCompressed2) {
          formData.append('image_2', image2);
        }
      }

      const createdData = await apiFetch('/listings/', {
        method: 'POST',
        body: formData
      });

      onCreated();
      setCreatedItem(createdData);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <i className="fa-solid fa-tag" /> New Item
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Create Listing
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

        {createdItem ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0', gap: '1.25rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--lightgreen)',
              color: 'var(--brandgreen)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>
              <i className="fa-solid fa-check" />
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Listing Published! ??
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.5' }}>
                Your item is live. Share it to your WhatsApp Status and hostel group chats right now to find a student buyer today!
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                                  onClick={() => {
                    const origin = window.location.origin;
                    const shareUrl = `${origin}/?item=${createdItem.id}`;
                    const campusTag = campuses.find(c => c.id === createdItem.campus_id)?.acronym || 'Campus';
                    const priceStr = (createdItem.price_kobo ? (createdItem.price_kobo / 100) : (createdItem.price || 0)).toLocaleString();
                    const text = `📦 Selling on CampusStash: ${createdItem.title} for ₦${priceStr} at ${campusTag}! View details & negotiate safely here: ${shareUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                style={{
                  width: '100%',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                }}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }} /> Share to WhatsApp Status
              </button>

              <button
                type="button"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/?item=${createdItem.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-alt)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className="fa-regular fa-copy" /> {copiedLink ? 'Link Copied! ??' : 'Copy Listing Link'}
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Done
            </button>
          </div>
        ) : (
        <>
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
              placeholder="e.g. Essential Calculus 8th Edition, Scientific Calculator fx-991"
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
                  placeholder="7,500"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
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
              placeholder="Provide details about condition, edition, accessories included, or preferred campus pickup spots..."
              style={{ resize: 'none' }}
            />
          </div>

          {/* Dual Image Uploaders */}
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
                {image1Preview ? (
                  <>
                    <img 
                      src={image1Preview} 
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
                      onClick={removeImage1}
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
                {image2Preview ? (
                  <>
                    <img 
                      src={image2Preview} 
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
                      onClick={removeImage2}
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

          {/* Campus selection field */}
          <div>
            <label className="form-label">Campus Location</label>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
                  <i className="fa-solid fa-check" />
                  Post Listing
                </>
              )}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}

export default CreateListingModal;
