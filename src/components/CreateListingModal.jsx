import React, { useState, useRef, useEffect } from 'react';
import { apiFetch, getCampuses, getActiveCampusId, CLOUD_HOST, DEFAULT_CAMPUSES } from '../api';

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

function CreateListingModal({ isOpen, onClose, onCreated, onSuccess }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Textbooks');
  const [campusId, setCampusId] = useState('');
  const [campuses, setCampuses] = useState(() => {
    try {
      const cached = localStorage.getItem('campusstash_cached_campuses');
      return cached ? JSON.parse(cached) : DEFAULT_CAMPUSES;
    } catch (e) {
      return DEFAULT_CAMPUSES;
    }
  });
  const [createdItem, setCreatedItem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [image1, setImage1] = useState(null);
  const [image1Preview, setImage1Preview] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image2Preview, setImage2Preview] = useState(null);
  const [compressedImage1, setCompressedImage1] = useState(null);
  const [compressedImage2, setCompressedImage2] = useState(null);
  const [isCompressing1, setIsCompressing1] = useState(false);
  const [isCompressing2, setIsCompressing2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState('single');
  const [batchItems, setBatchItems] = useState([]);
  const [batchResultCount, setBatchResultCount] = useState(0);
  const batchFileInputRef = useRef(null);

  const handleBatchFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim(),
      price: '',
      category: 'Fashion & Apparel',
      description: ''
    }));
    setBatchItems(prev => [...prev, ...newItems].slice(0, 20));
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  const handleRemoveBatchItem = (id) => {
    setBatchItems(prev => {
      const target = prev.find(i => i.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleUpdateBatchItem = (id, field, value) => {
    setBatchItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!batchItems.length) {
      setError('Please select at least 1 product image for your batch drop.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const payloadItems = [];
      for (const item of batchItems) {
        if (!item.title.trim()) {
          throw new Error('Please give every item in the batch drop a title.');
        }
        const cleanPrice = String(item.price || '').replace(/[₦,\s,]/g, '');
        const priceFloat = parseFloat(cleanPrice);
        if (isNaN(priceFloat) || priceFloat <= 0) {
          throw new Error(`Please provide a valid price for "${item.title}".`);
        }
        const priceKobo = Math.round(priceFloat * 100);

        let imgUrl = null;
        if (item.file) {
          imgUrl = await compressImage(item.file).catch(() => null);
        }

        payloadItems.push({
          title: item.title.trim(),
          description: item.description?.trim() || 'Part of campus shop drop. DM to inspect or buy on campus.',
          price_kobo: priceKobo,
          category: item.category || 'Fashion & Apparel',
          status: 'active',
          campus_id: campusId || null,
          image_url: imgUrl
        });
      }

      const res = await apiFetch('/listings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      });

      setBatchResultCount(payloadItems.length);
      setCreatedItem({ isBatch: true, count: payloadItems.length, items: res });
      if (typeof onCreated === 'function') {
        try { onCreated(res); } catch (err) {}
      }
      if (typeof onSuccess === 'function') {
        try { onSuccess(res); } catch (err) {}
      }
    } catch (err) {
      setError(err.message || 'Failed to publish batch drop');
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setCreatedItem(null);
      setCopiedLink(false);
      getCampuses().then(data => {
        if (Array.isArray(data)) {
          setCampuses(data);
          const active = getActiveCampusId();
          const userSaved = localStorage.getItem('campusstash_user_campus');
          if (active) {
            setCampusId(active);
          } else if (userSaved) {
            setCampusId(userSaved);
          } else {
            setCampusId('');
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
      setIsCompressing1(true);
      compressImage(file)
        .then(c => setCompressedImage1(c))
        .catch(err => console.warn('Compression note 1:', err))
        .finally(() => setIsCompressing1(false));
    }
  };

  const handleImage2Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage2(file);
      setImage2Preview(URL.createObjectURL(file));
      setIsCompressing2(true);
      compressImage(file)
        .then(c => setCompressedImage2(c))
        .catch(err => console.warn('Compression note 2:', err))
        .finally(() => setIsCompressing2(false));
    }
  };

  const removeImage1 = (e) => {
    e.stopPropagation();
    if (image1Preview) URL.revokeObjectURL(image1Preview);
    setImage1(null);
    setImage1Preview(null);
    setCompressedImage1(null);
    setIsCompressing1(false);
  };

  const removeImage2 = (e) => {
    e.stopPropagation();
    if (image2Preview) URL.revokeObjectURL(image2Preview);
    setImage2(null);
    setImage2Preview(null);
    setCompressedImage2(null);
    setIsCompressing2(false);
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
    setCompressedImage1(null);
    setCompressedImage2(null);
    setIsCompressing1(false);
    setIsCompressing2(false);
    batchItems.forEach(i => { if (i.preview) URL.revokeObjectURL(i.preview); });
    setBatchItems([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const cleanPrice = String(price || '').replace(/[₦,\s,]/g, '');
      const priceFloat = parseFloat(cleanPrice);
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
      if (compressedImage1) {
        formData.append('image_url', compressedImage1);
      } else if (image1) {
        const c1 = await compressImage(image1).catch(() => null);
        if (c1) {
          formData.append('image_url', c1);
        } else {
          formData.append('image', image1);
        }
      }

      // Secondary Image (Detail / Back)
      if (compressedImage2) {
        formData.append('image_2_url', compressedImage2);
      } else if (image2) {
        const c2 = await compressImage(image2).catch(() => null);
        if (c2) {
          formData.append('image_2_url', c2);
        } else {
          formData.append('image_2', image2);
        }
      }

      const createdData = await apiFetch('/listings/', {
        method: 'POST',
        body: formData
      });

      if (typeof onCreated === 'function') {
        try { onCreated(createdData); } catch (e) {}
      }
      if (typeof onSuccess === 'function') {
        try { onSuccess(createdData); } catch (e) {}
      }
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
                {createdItem.isBatch ? `🎉 Batch Drop Live! (${createdItem.count} Items)` : 'Listing Published!'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: '1.5' }}>
                {createdItem.isBatch 
                  ? `Successfully published ${createdItem.count} items to your campus shop catalog. Broadcast the drop to your WhatsApp Status now!`
                  : 'Your item is live. Share it to your WhatsApp Status and hostel group chats right now to find a student buyer today!'}
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  const shareBase = CLOUD_HOST || window.location.origin;
                  const shareUrl = createdItem.isBatch
                    ? `${shareBase}/dashboard`
                    : `${shareBase}/l/${createdItem.id}`;
                  const campusTag = campuses.find(c => c.id === (createdItem.campus_id || campusId))?.acronym || 'Campus';
                  const priceStr = (!createdItem.isBatch && createdItem.price_kobo) ? (createdItem.price_kobo / 100).toLocaleString() : '';
                  const text = createdItem.isBatch
                    ? `🔥 New Stock Alert! Just dropped ${createdItem.count} items on my CampusStash shop at ${campusTag}! Check out everything in stock here: ${shareUrl}`
                    : `📦 Selling on CampusStash: ${createdItem.title} for ₦${priceStr} at ${campusTag}! View details & negotiate safely here: ${shareUrl}`;
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
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }} /> Share Drop to WhatsApp Status
              </button>

              <button
                type="button"
                onClick={() => {
                  const shareUrl = createdItem.isBatch
                    ? `${window.location.origin}/dashboard`
                    : `${window.location.origin}/?item=${createdItem.id}`;
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
                <i className="fa-regular fa-copy" /> {copiedLink ? 'Link Copied!' : (createdItem.isBatch ? 'Copy Shop Link' : 'Copy Listing Link')}
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
          {/* Mode Switcher: Single Item vs Vendor Batch Drop */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-alt)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '1.25rem',
            border: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={() => { setUploadMode('single'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: uploadMode === 'single' ? 'var(--surface)' : 'transparent',
                color: uploadMode === 'single' ? 'var(--terracotta)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: uploadMode === 'single' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📦 Single Listing
            </button>
            <button
              type="button"
              onClick={() => { setUploadMode('batch'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: uploadMode === 'batch' ? 'var(--surface)' : 'transparent',
                color: uploadMode === 'batch' ? 'var(--terracotta)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: uploadMode === 'batch' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🏪 Vendor Batch Drop (5-15 Items)
            </button>
          </div>

          {error && (
            <div style={{
              color: 'var(--text-main)',
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              padding: '0.8rem 1rem',
              borderRadius: '14px',
              marginBottom: '1.25rem',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--lightblue)',
                color: 'var(--brandblue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                flexShrink: 0
              }}>
                <i className="fa-solid fa-circle-info" />
              </div>
              <span style={{ fontWeight: '500' }}>{error}</span>
            </div>
          )}

          {uploadMode === 'batch' ? (
            /* ============================================================== */
            /* BATCH DROP FORM FOR STUDENT SHOPS                             */
            /* ============================================================== */
            <form onSubmit={handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{
                backgroundColor: 'var(--surface-alt)',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>💡</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Select multiple photos from your gallery at once. Each photo becomes an item in your drop with its own title and price.
                </span>
              </div>

              {/* Campus Location for Batch Drop */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--brandblue)' }} />
                    <span>Campus Location for Drop</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--brandblue)', fontWeight: '600' }}>
                    Required
                  </span>
                </div>
                <select 
                  className="form-input"
                  value={campusId}
                  onChange={(e) => {
                    setCampusId(e.target.value);
                    if (e.target.value) localStorage.setItem('campusstash_user_campus', e.target.value);
                  }}
                  required
                  style={{ cursor: 'pointer', backgroundColor: 'var(--surface)' }}
                >
                  <option value="">-- Select Campus (e.g. Lead City, UI, Poly Ibadan...) --</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.acronym} - {c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Photo Picker Dropzone */}
              <input 
                type="file" 
                ref={batchFileInputRef} 
                onChange={handleBatchFiles} 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              <div 
                onClick={() => batchFileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--terracotta)',
                  borderRadius: '16px',
                  padding: '1.35rem 1rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface-alt)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
                  📸
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.96rem', color: 'var(--text-main)' }}>
                  {batchItems.length > 0 ? '+ Add More Photos to Drop' : 'Tap to Pick 5–15 Photos from Gallery'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Thrift clothing, shoes, accessories, or tech products
                </div>
              </div>

              {/* Batch Queue Cards */}
              {batchItems.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    Drop Items ({batchItems.length}):
                  </div>
                  {batchItems.map((item, idx) => (
                    <div 
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '14px',
                        backgroundColor: 'var(--surface-alt)',
                        border: '1px solid var(--border)',
                        alignItems: 'center'
                      }}
                    >
                      {/* Thumbnail with Remove */}
                      <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={item.preview} alt={`Item ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveBatchItem(item.id)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#FFFFFF',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            cursor: 'pointer'
                          }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Title & Price & Category */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <input 
                          type="text"
                          className="form-input"
                          value={item.title}
                          onChange={(e) => handleUpdateBatchItem(item.id, 'title', e.target.value)}
                          placeholder={`Item #${idx + 1} Title (e.g. Nike Vintage Tee)`}
                          required
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.86rem', backgroundColor: 'var(--surface)' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <input 
                            type="number"
                            className="form-input"
                            value={item.price}
                            onChange={(e) => handleUpdateBatchItem(item.id, 'price', e.target.value)}
                            placeholder="₦ Price"
                            required
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.86rem', backgroundColor: 'var(--surface)' }}
                          />
                          <select
                            className="form-input"
                            value={item.category}
                            onChange={(e) => handleUpdateBatchItem(item.id, 'category', e.target.value)}
                            style={{ padding: '0.45rem 0.65rem', fontSize: '0.84rem', backgroundColor: 'var(--surface)' }}
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons for Batch */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSubmitting || batchItems.length === 0}
                  style={{ borderRadius: '9999px', padding: '0.7rem 1.4rem' }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin" />
                      Publishing {batchItems.length} items...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rocket" />
                      Publish Drop ({batchItems.length} items)
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--brandblue)' }} />
                <span>Campus / University Location</span>
              </label>
              <span style={{ fontSize: '0.74rem', color: 'var(--brandblue)', fontWeight: '600' }}>
                Required
              </span>
            </div>
            <select 
              className="form-input"
              value={campusId}
              onChange={(e) => {
                setCampusId(e.target.value);
                if (e.target.value) localStorage.setItem('campusstash_user_campus', e.target.value);
              }}
              required
              style={{
                cursor: 'pointer',
                backgroundColor: 'var(--surface)',
                border: !campusId ? '1.5px solid var(--brandblue)' : undefined
              }}
            >
              <option value="">-- Select Your Campus (e.g. UI, LCU, UNILAG...) --</option>
              {campuses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.acronym} - {c.name} ({c.state})
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Students from this university will see your listing in their campus stash.
            </span>
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
                  {'\u20A6'}
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
                    {isCompressing1 ? (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.35rem',
                        left: '0.35rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: 'var(--brandblue)',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <i className="fa-solid fa-circle-notch fa-spin" /> Optimizing...
                      </div>
                    ) : compressedImage1 ? (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.35rem',
                        left: '0.35rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <i className="fa-solid fa-bolt" /> Ready
                      </div>
                    ) : null}
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
                    {isCompressing2 ? (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.35rem',
                        left: '0.35rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        color: 'var(--brandblue)',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <i className="fa-solid fa-circle-notch fa-spin" /> Optimizing...
                      </div>
                    ) : compressedImage2 ? (
                      <div style={{
                        position: 'absolute',
                        bottom: '0.35rem',
                        left: '0.35rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <i className="fa-solid fa-bolt" /> Ready
                      </div>
                    ) : null}
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
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default CreateListingModal;
