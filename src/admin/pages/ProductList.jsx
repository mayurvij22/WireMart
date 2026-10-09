import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProductList } from '../../hooks/useProductList';
import { deleteProduct, setProductStock } from '../../lib/catalog';
import { formatPrice, friendlyError } from '../../lib/format';
import SearchBar from '../../components/SearchBar';
import ProductImage from '../../components/ProductImage';
import { ErrorBox, Spinner } from '../../components/Status';

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const q = params.get('q') || '';
  const { categories, byId } = useCategories();
  const list = useProductList({ categoryId: cat, search: q });
  const location = useLocation();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const flash = location.state?.flash;

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  }

  async function run(id, action) {
    setBusyId(id);
    setActionError('');
    try {
      await action();
      list.sync();
    } catch (e) {
      setActionError(friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    run(p.id, () => deleteProduct(p.id));
  }

  return (
    <>
      {flash && (
        <div className="flash" role="status">
          {flash}
          <button type="button" className="flash-close" aria-label="Dismiss" onClick={() => navigate('.', { replace: true, state: null })}>
            ✕
          </button>
        </div>
      )}

      <div className="admin-head">
        <h1>Products</h1>
        <Link to="/admin/new" className="btn btn-primary btn-large add-product-btn">
          + Add New Product
        </Link>
      </div>

      <div className="admin-filters">
        <SearchBar value={q} onChange={(v) => update({ q: v })} />
        <select className="select" value={cat} onChange={(e) => update({ cat: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      <ul className="admin-list">
        {list.items.map((p) => (
          <li key={p.id} className="admin-row">
            <ProductImage src={p.imageUrl} alt={p.name} className="admin-thumb" />
            <div className="admin-row-info">
              <strong className="row-name">{p.name}</strong>
              <span className="row-price">{formatPrice(p.price)}</span>
              <span className="muted row-cat">{byId[p.category]?.name || '—'}</span>
            </div>
            <div className="admin-row-actions">
              <button
                type="button"
                className={`btn btn-small ${p.inStock ? 'btn-stock-in' : 'btn-stock-out'}`}
                disabled={busyId === p.id}
                onClick={() => run(p.id, () => setProductStock(p.id, !p.inStock))}
                title="Tap to change stock"
              >
                {p.inStock ? 'In Stock' : 'Out of Stock'}
              </button>
              <Link to={`/admin/edit/${p.id}`} className="btn btn-small btn-secondary">
                Edit
              </Link>
              <button type="button" className="btn btn-small btn-danger" disabled={busyId === p.id} onClick={() => remove(p)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {list.loading && <Spinner />}
      <ErrorBox error={list.error} onRetry={list.retry} />
      {list.loaded && !list.loading && list.items.length === 0 && !list.hasMore && (
        <p className="empty">No products yet.</p>
      )}
      {list.loaded && list.hasMore && !list.loading && !list.error && (
        <button type="button" className="btn btn-secondary btn-block load-more" onClick={list.loadMore}>
          Load More
        </button>
      )}
    </>
  );
}
