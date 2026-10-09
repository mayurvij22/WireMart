import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { getProduct, saveProduct } from '../../lib/catalog';
import { friendlyError, normalizeImageUrl } from '../../lib/format';
import ProductImage from '../../components/ProductImage';
import { Spinner } from '../../components/Status';
import { isEmbeddedPhoto, photoToDataUrl } from '../photo';

const blank = (category = '') => ({
  name: '',
  price: '',
  category,
  features: [''],
  imageUrl: '',
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

  async function onPhoto(e) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await photoToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(`Could not use this photo: ${err.message}`);
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  useEffect(() => {
    if (!id) {
      setForm(blank());
      return;
    }
    setForm(null);
    getProduct(id)
      .then((p) => {
        if (!p) return setLoadError('Product not found.');
        setForm({ ...p, price: String(p.price), features: p.features.length ? p.features : [''] });
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
      await saveProduct(id, form);
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
            <span>Photo</span>
            {form.imageUrl && (
              <ProductImage
                key={form.imageUrl}
                src={normalizeImageUrl(form.imageUrl)}
                alt="Preview"
                className="image-preview"
              />
            )}
            <label className={`btn btn-secondary btn-block btn-large file-btn ${uploading ? 'disabled' : ''}`}>
              {uploading ? 'Preparing photo…' : form.imageUrl ? '📷 Change Photo' : '📷 Add Photo'}
              <input type="file" accept="image/*" hidden disabled={uploading} onChange={onPhoto} />
            </label>
            {form.imageUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => setForm({ ...form, imageUrl: '' })}
              >
                Remove photo
              </button>
            )}
          </div>
          {!isEmbeddedPhoto(form.imageUrl) && (
            <label className="field">
              <span className="muted">Or paste an image link</span>
              <input
                type="url"
                inputMode="url"
                value={form.imageUrl}
                onChange={set('imageUrl')}
                placeholder="https://…"
              />
            </label>
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
