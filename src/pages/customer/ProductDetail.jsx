import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMorePhotos, getProduct, getRelatedProducts, variantLabel } from '../../lib/catalog';
import { formatPrice } from '../../lib/format';
import { useCategories } from '../../hooks/useCategories';
import AddToCart from '../../components/AddToCart';
import BuyButton from '../../components/BuyButton';
import PhotoGallery from '../../components/PhotoGallery';
import ProductCard from '../../components/ProductCard';
import StockBadge from '../../components/StockBadge';
import { ErrorBox, Spinner } from '../../components/Status';

function RelatedRow({ title, products, label }) {
  if (!products.length) return null;
  return (
    <section className="mt-12">
      <h2 className="m-0 text-xl font-bold tracking-tight">{title}</h2>
      <div className="-mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-40 flex-none snap-start sm:w-48">
            <ProductCard product={p} tag={label?.(p)} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { byId } = useCategories();
  const [product, setProduct] = useState(undefined);
  const [error, setError] = useState(null);
  const [morePhotos, setMorePhotos] = useState([]);
  const [related, setRelated] = useState({ variants: [], similar: [] });

  useEffect(() => {
    let alive = true;
    setProduct(undefined);
    setError(null);
    setMorePhotos([]);
    setRelated({ variants: [], similar: [] });
    getProduct(id)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        if (!p) return;
        // Extras load after the page shows; a failure just leaves them out.
        getMorePhotos(p).then((list) => alive && setMorePhotos(list), () => {});
        getRelatedProducts(p).then((r) => alive && setRelated(r), () => {});
      })
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, [id]);

  // Go back to the list (keeps scroll position) or home when opened from a shared link.
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  if (error) return <ErrorBox error={error} />;
  if (product === undefined) return <Spinner />;
  if (product === null) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-600">This product is no longer available.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-white no-underline">
          Browse products
        </Link>
      </div>
    );
  }

  const category = byId[product.category];

  return (
    <article className="pb-24 lg:pb-0">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <button type="button" onClick={goBack} className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-ink hover:underline">
          ← Back
        </button>
        {category && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/?cat=${category.id}`} className="text-gray-500 no-underline hover:text-ink hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0 lg:sticky lg:top-28">
          <PhotoGallery photos={[product.imageUrl, ...morePhotos].filter(Boolean)} alt={product.name} />
        </div>

        <div className="flex flex-col">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            <StockBadge inStock={product.inStock} />
          </div>

          {/* Phones: fixed bar at the bottom. Computers: shown here beside the photo. */}
          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:mt-6 lg:border-0 lg:p-0">
            {!product.inStock && <span className="text-xl font-bold whitespace-nowrap lg:hidden">{formatPrice(product.price)}</span>}
            {product.inStock && <AddToCart product={product} className="h-12 flex-1 text-base lg:max-w-xs" />}
            <BuyButton product={product} className="h-12 flex-1 text-base lg:max-w-xs" />
          </div>

          {product.features.length > 0 && (
            <section className="mt-8 rounded-2xl border border-gray-200 p-5">
              <h2 className="m-0 mb-3 text-lg font-bold">Features</h2>
              <ul className="m-0 list-none space-y-2 p-0">
                {product.features.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[15px] text-gray-700">
                    <span aria-hidden="true" className="text-buy">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.description && (
            <section className="mt-6">
              <h2 className="m-0 mb-2 text-lg font-bold">Description</h2>
              <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{product.description}</p>
            </section>
          )}

          <p className="mt-8 rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink">
            💬 {product.inStock ? (
              <>
                Buying several items? <strong>Add to cart</strong>, then send the whole order with the bill total in one WhatsApp message.
              </>
            ) : (
              <>
                Tap <strong>Ask on WhatsApp</strong> — your message is filled in for you.
              </>
            )}
          </p>
        </div>
      </div>

      <RelatedRow title="Other sizes & colours" products={related.variants} label={(p) => variantLabel(product, p)} />
      <RelatedRow title={category ? `More in ${category.name}` : 'Similar items'} products={related.similar} />
    </article>
  );
}
