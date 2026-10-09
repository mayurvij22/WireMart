import { useSearchParams } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useProductList } from '../../hooks/useProductList';
import ProductCard from '../../components/ProductCard';
import { ErrorBox, Spinner } from '../../components/Status';
import { WhatsAppIcon } from '../../components/BuyButton';
import { categoryIcon } from '../../lib/categoryIcon';
import { WHATSAPP_NUMBER } from '../../config';

const COLLAGE = [
  { icon: '💡', bg: 'bg-amber-100', span: 'row-span-2' },
  { icon: '🔌', bg: 'bg-violet-100', span: '' },
  { icon: '🚰', bg: 'bg-sky-100', span: '' },
  { icon: '🔧', bg: 'bg-emerald-100', span: 'col-span-2' },
];

const HIGHLIGHTS = [
  ['🏷️', 'Genuine brands'],
  ['💬', 'Order on WhatsApp'],
  ['🚚', 'Local delivery'],
];

function CategoryTile({ category, onClick }) {
  const icon = categoryIcon(category.name);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer flex-col items-center gap-2 rounded-xl border-0 bg-transparent p-1 text-center"
    >
      <span
        aria-hidden="true"
        className="grid aspect-square w-full max-w-24 place-items-center rounded-xl bg-gray-100 text-3xl font-extrabold text-gray-700 transition group-hover:bg-gray-200"
      >
        {icon || category.name.charAt(0).toUpperCase()}
      </span>
      <span className="line-clamp-2 text-xs font-medium text-ink sm:text-sm">{category.name}</span>
    </button>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 flex-none cursor-pointer whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
        active ? 'border-ink bg-ink text-white' : 'border-gray-300 bg-white text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  );
}

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
      : 'All products';

  return (
    <>
      {browsing && (
        <section className="grid items-center gap-10 pb-12 lg:grid-cols-2 lg:gap-16 lg:pt-6">
          <div>
            <h1 className="m-0 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[44px]">
              Electrical &amp; plumbing supplies for every job
            </h1>

            <div className="mt-8 rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="m-0 mb-5 text-lg font-semibold text-gray-600">What are you looking for?</h2>
              {catLoading && categories.length === 0 && <Spinner />}
              <ErrorBox error={catError} onRetry={() => refresh(true)} />
              <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
                {categories.map((c) => (
                  <CategoryTile key={c.id} category={c} onClick={() => update({ cat: c.id }, false)} />
                ))}
              </div>
            </div>

            <ul className="m-0 mt-8 flex list-none flex-wrap gap-x-8 gap-y-3 p-0">
              {HIGHLIGHTS.map(([icon, label]) => (
                <li key={label} className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className="text-xl">
                    {icon}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className="hidden h-[520px] grid-cols-2 grid-rows-3 gap-3 lg:grid">
            {COLLAGE.map((tile) => (
              <div key={tile.icon} className={`grid place-items-center rounded-2xl text-7xl ${tile.bg} ${tile.span}`}>
                {tile.icon}
              </div>
            ))}
          </div>
        </section>
      )}

      {browsing && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-12 flex items-center justify-between gap-4 rounded-2xl bg-ink px-6 py-7 text-white no-underline sm:px-10"
        >
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-widest text-white/60">Can’t find it?</p>
            <p className="m-0 mt-1 text-xl font-bold sm:text-2xl">Send us a photo on WhatsApp — we’ll find it for you.</p>
          </div>
          <span className="hidden flex-none items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink sm:inline-flex">
            <WhatsAppIcon /> Chat now
          </span>
        </a>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-2xl font-bold tracking-tight">{heading}</h2>
          {list.loaded && list.items.length > 0 && (
            <span className="whitespace-nowrap text-sm text-gray-500">
              {list.items.length}
              {list.hasMore ? '+' : ''} {list.items.length === 1 && !list.hasMore ? 'item' : 'items'}
            </span>
          )}
        </div>

        {categories.length > 0 && (
          <nav
            aria-label="Categories"
            className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
          >
            <Pill active={!cat} onClick={() => update({ cat: '' })}>
              All
            </Pill>
            {categories.map((c) => (
              <Pill key={c.id} active={cat === c.id} onClick={() => update({ cat: c.id })}>
                {c.name}
              </Pill>
            ))}
          </nav>
        )}

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {list.loading && <Spinner />}
        <ErrorBox error={list.error} onRetry={list.retry} />

        {list.loaded && !list.loading && list.items.length === 0 && !list.hasMore && (
          <div className="py-12 text-center text-gray-500">
            <p>No products found.</p>
            {!browsing && (
              <button
                type="button"
                className="mt-2 cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-ink hover:border-ink"
                onClick={() => setParams({}, { replace: true })}
              >
                Show all products
              </button>
            )}
          </div>
        )}

        {list.loaded && list.hasMore && !list.loading && !list.error && (
          <div className="mt-10 text-center">
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-ink bg-white px-8 py-3 font-semibold text-ink hover:bg-ink hover:text-white"
              onClick={list.loadMore}
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </>
  );
}
