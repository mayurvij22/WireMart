import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { getMorePhotos, getProduct, MAX_PHOTOS, saveProduct } from '../../lib/catalog';
import { friendlyError, normalizeImageUrl } from '../../lib/format';
import ProductImage from '../../components/ProductImage';
import { Spinner } from '../../components/Status';
import { photoToDataUrl } from '../photo';

const blank = (category = '') => ({
  name: '',
  price: '',
  category,
  features: [''],
  photos: [], // first one is the main photo
  description: '',
  inStock: true,
});

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, loading: catLoading } = useCategories();
  const [form, setForm] = useState(id ? null : blank());
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoLink, setPhotoLink] = useState('');

  async function onPhotos(e) {
    const input = e.target;
    const room = MAX_PHOTOS - form.photos.length;
    const files = [...(input.files || [])];
    if (!files.length) return;
    setUploading(true);
    setError('');
    const problems = [];
    try {
      for (const file of files.slice(0, room)) {
        try {
          const url = await photoToDataUrl(file);
          setForm((f) => ({ ...f, photos: [...f.photos, url].slice(0, MAX_PHOTOS) }));
        } catch (err) {
          problems.push(`${file.name}: ${err.message}`);
        }
      }
      if (files.length > room) problems.push(`Only ${MAX_PHOTOS} photos per product — ${files.length - room} not added.`);
      if (problems.length) setError(`Some photos were not added. ${problems.join(' ')}`);
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  function addPhotoLink() {
    const url = normalizeImageUrl(photoLink);
    if (!/^https?:\/\//.test(url)) return setError('Please paste a full image link starting with https://');
    setError('');
    setForm((f) => ({ ...f, photos: [...f.photos, url].slice(0, MAX_PHOTOS) }));
    setPhotoLink('');
  }

  const removePhoto = (i) => setForm((f) => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }));
  const makeMain = (i) => setForm((f) => ({ ...f, photos: [f.photos[i], ...f.photos.filter((_, j) => j !== i)] }));

  useEffect(() => {
    if (!id) {
      setForm(blank());
      return;
    }
    setForm(null);
    getProduct(id)
      .then(async (p) => {
        if (!p) return setLoadError('Product not found.');
        const photos = [p.imageUrl, ...(await getMorePhotos(p))].filter(Boolean);
        setForm({ ...p, photos, price: String(p.price), features: p.features.length ? p.features : [''] });
      })
      .catch((e) => setLoadError(friendlyError(e)));
  }, [id]);

  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!form) return <Spinner />;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setFeature = (i, value) => setForm({ ...form, features: form.features.map((f, j) => (j === i ? value : f)) });
  const addFeature = () => setForm({ ...form, features: [...form.features, ''] });
  const removeFeature = (i) => setForm({ ...form, features: form.features.filter((_, j) => j !== i) });

  async function submit(e, addAnother = false) {
    e.preventDefault();
    setError('');
    setSavedName('');
    const price = Number(form.price);
    if (!form.name.trim()) return setError('Please enter the product name.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setError('Please enter a valid price.');
    if (!form.category) return setError('Please choose a category.');

    setSaving(true);
    try {
      const [imageUrl = '', ...moreImages] = form.photos;
      await saveProduct(id, { ...form, imageUrl, moreImages });
      if (addAnother) {
        setSavedName(form.name.trim());
        setForm(blank(form.category));
        window.scrollTo(0, 0);
      } else {
        navigate('/admin', { state: { flash: `Saved "${form.name.trim()}"` } });
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form product-form" onSubmit={(e) => submit(e)}>
      <div className="form-head">
        <h1>{id ? 'Edit Product' : 'Add Product'}</h1>
        {savedName && <div className="flash">Saved “{savedName}”. Add the next one.</div>}
      </div>

      <div className="form-main panel">
        <label className="field">
          <span>Product name *</span>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Anchor 6A Modular Switch" required />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Price (₹) *</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.price}
              onChange={set('price')}
              required
            />
          </label>

          <label className="field">
            <span>Category *</span>
            <select className="select" value={form.category} onChange={set('category')} required>
              <option value="">{catLoading ? 'Loading…' : 'Choose category'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link to="/admin/categories" className="field-link">
              + Add a new category
            </Link>
          </label>
        </div>

        <fieldset className="field">
          <legend>Features</legend>
          {form.features.map((f, i) => (
            <div className="feature-row" key={i}>
              <input value={f} onChange={(e) => setFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} />
              {form.features.length > 1 && (
                <button
                  type="button"
                  className="btn btn-small btn-ghost"
                  aria-label={`Remove feature ${i + 1}`}
                  onClick={() => removeFeature(i)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addFeature}>
            + Add feature
          </button>
        </fieldset>

        <label className="field">
          <span>Description</span>
          <textarea rows={5} value={form.description} onChange={set('description')} />
        </label>
      </div>

      <aside className="form-side">
        <div className="panel">
          <div className="field">
            <span>
              Photos ({form.photos.length}/{MAX_PHOTOS})
            </span>
            {form.photos.length > 0 && (
              <ul className="m-0 mb-2 grid list-none grid-cols-3 gap-2 p-0">
                {form.photos.map((url, i) => (
                  <li key={`${i}-${url.slice(-24)}`} className="relative">
                    <ProductImage
                      src={normalizeImageUrl(url)}
                      alt={`Photo ${i + 1}`}
                      className={`aspect-square w-full rounded-lg border bg-white object-contain ${
                        i === 0 ? 'border-2 border-emerald-600' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 grid size-7 cursor-pointer place-items-center rounded-full border-0 bg-black/60 text-xs text-white"
                    >
                      ✕
                    </button>
                    {i === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        Main
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeMain(i)}
                        className="absolute bottom-1 left-1 cursor-pointer rounded border-0 bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-gray-800 shadow"
                      >
                        Make main
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {form.photos.length < MAX_PHOTOS && (
              <label className={`btn btn-secondary btn-block btn-large file-btn ${uploading ? 'disabled' : ''}`}>
                {uploading ? 'Preparing photos…' : form.photos.length ? '📷 Add More Photos' : '📷 Add Photos'}
                <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={onPhotos} />
              </label>
            )}
            <span className="muted text-xs">Up to {MAX_PHOTOS} photos. The first one is shown in the product list.</span>
          </div>
          {form.photos.length < MAX_PHOTOS && (
            <div className="field">
              <span className="muted">Or paste an image link</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  inputMode="url"
                  value={photoLink}
                  onChange={(e) => setPhotoLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPhotoLink();
                    }
                  }}
                  placeholder="https://…"
                  className="min-w-0 flex-1"
                />
                <button type="button" className="btn btn-secondary" disabled={!photoLink.trim()} onClick={addPhotoLink}>
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
            />
            <span className="toggle-track" aria-hidden="true" />
            <span>{form.inStock ? 'In Stock' : 'Out of Stock'}</span>
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-large btn-block" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save Product'}
          </button>
          {!id && (
            <button
              type="button"
              className="btn btn-secondary btn-large btn-block"
              disabled={saving || uploading}
              onClick={(e) => submit(e, true)}
            >
              Save &amp; Add Another
            </button>
          )}
          <Link to="/admin" className="btn btn-ghost btn-block">
            Cancel
          </Link>
        </div>
      </aside>
    </form>
  );
}
