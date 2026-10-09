import { useSearchParams } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProductList } from '../../hooks/useProductList';
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import { ErrorBox, Spinner } from '../../components/Status';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const q = params.get('q') || '';
  const { categories, byId, loading: catLoading, error: catError, refresh } = useCategories();
  const list = useProductList({ categoryId: cat, search: q });
  const browsing = !cat && !q;

  function update(changes, replace = true) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace });
  }

  const heading = q
    ? `Results for “${q}”${cat && byId[cat] ? ` in ${byId[cat].name}` : ''}`
    : cat
      ? byId[cat]?.name || 'Category'
      : 'All Products';

  return (
    <div className="shop-layout">
      {/* Computer: category list on the left. Hidden on phones (they use tiles/chips). */}
      <aside className="shop-sidebar" aria-label="Categories">
        <h2 className="sidebar-title">Categories</h2>
        <nav className="sidebar-list">
          <button type="button" className={`sidebar-item ${!cat ? 'active' : ''}`} onClick={() => update({ cat: '' }, false)}>
            All Products
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`sidebar-item ${cat === c.id ? 'active' : ''}`}
              onClick={() => update({ cat: c.id }, false)}
            >
              {c.name}
            </button>
          ))}
        </nav>
        {catLoading && categories.length === 0 && <Spinner />}
      </aside>

      <div className="shop-main">
        <div className="sticky-tools">
          <SearchBar value={q} onChange={(v) => update({ q: v })} />
          {!browsing && categories.length > 0 && (
            <nav className="chips" aria-label="Categories">
              <button type="button" className={`chip ${!cat ? 'active' : ''}`} onClick={() => update({ cat: '' })}>
                All
              </button>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`chip ${cat === c.id ? 'active' : ''}`}
                  onClick={() => update({ cat: c.id })}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          )}
        </div>

        {browsing && (
          <section className="hero">
            <div>
              <h1 className="hero-title">Electrical &amp; Nal Fitting for every job</h1>
              <p className="hero-text">Switches, wires, MCBs, lights, pipes, taps and fittings. Tap <strong>Buy Now</strong> to order on WhatsApp.</p>
            </div>
          </section>
        )}

        {browsing && (
          <section className="category-section">
            <h2 className="section-title">Shop by Category</h2>
            {catLoading && categories.length === 0 && <Spinner />}
            <ErrorBox error={catError} onRetry={() => refresh(true)} />
            <div className="category-grid">
              {categories.map((c) => (
                <button type="button" key={c.id} className="category-tile" onClick={() => update({ cat: c.id }, false)}>
                  <span className="category-initial" aria-hidden="true">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="category-name">{c.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="section-head">
            <h2 className="section-title">{heading}</h2>
            {list.loaded && list.items.length > 0 && (
              <span className="muted section-count">
                {list.items.length}
                {list.hasMore ? '+' : ''} {list.items.length === 1 && !list.hasMore ? 'item' : 'items'}
              </span>
            )}
          </div>
          <div className="product-grid">
            {list.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {list.loading && <Spinner />}
          <ErrorBox error={list.error} onRetry={list.retry} />

          {list.loaded && !list.loading && list.items.length === 0 && !list.hasMore && (
            <div className="empty">
              <p>No products found.</p>
              {!browsing && (
                <button type="button" className="btn btn-secondary" onClick={() => setParams({}, { replace: true })}>
                  Show all products
                </button>
              )}
            </div>
          )}

          {list.loaded && list.hasMore && !list.loading && !list.error && (
            <button type="button" className="btn btn-primary btn-block load-more" onClick={list.loadMore}>
              Load More
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
