import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../../lib/catalog';
import { formatPrice } from '../../lib/format';
import { useCategories } from '../../hooks/useCategories';
import BuyButton from '../../components/BuyButton';
import ProductImage from '../../components/ProductImage';
import StockBadge from '../../components/StockBadge';
import { ErrorBox, Spinner } from '../../components/Status';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { byId } = useCategories();
  const [product, setProduct] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setProduct(undefined);
    setError(null);
    getProduct(id)
      .then((p) => alive && setProduct(p))
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
        <div className="overflow-hidden rounded-2xl bg-gray-50 lg:sticky lg:top-28">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square max-h-[560px] w-full object-contain p-6 text-6xl"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            <StockBadge inStock={product.inStock} />
          </div>

          {/* Phones: fixed bar at the bottom. Computers: shown here beside the photo. */}
          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:mt-6 lg:border-0 lg:p-0">
            <span className="text-xl font-bold whitespace-nowrap lg:hidden">{formatPrice(product.price)}</span>
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
            💬 Tap <strong>{product.inStock ? 'Buy Now' : 'Ask on WhatsApp'}</strong> — your order message is filled in for you.
          </p>
        </div>
      </div>
    </article>
  );
}
