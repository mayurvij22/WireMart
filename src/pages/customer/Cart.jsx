import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { cartWhatsappLink, formatPrice } from '../../lib/format';
import { QtyStepper } from '../../components/AddToCart';
import { WhatsAppIcon } from '../../components/BuyButton';
import ProductImage from '../../components/ProductImage';

export default function Cart() {
  const { items, count, total, remove, clear } = useCart();
  const navigate = useNavigate();
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p aria-hidden="true" className="text-5xl">🛒</p>
        <h1 className="m-0 mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="text-gray-600">Add products with “Add to cart”, then send the whole order on WhatsApp.</p>
        <Link to="/" className="mt-4 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-white no-underline">
          Browse products
        </Link>
      </div>
    );
  }

  const outOfStock = items.filter((i) => i.inStock === false).length;

  return (
    <div className="pb-28 lg:pb-0">
      <button type="button" onClick={goBack} className="mb-4 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-ink hover:underline">
        ← Continue shopping
      </button>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="m-0 text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
        <button
          type="button"
          onClick={() => window.confirm('Remove all items from the cart?') && clear()}
          className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-red-700 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="m-0 list-none divide-y divide-gray-200 rounded-2xl border border-gray-200 p-0">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <Link to={`/product/${item.id}`} className="flex-none">
                <ProductImage src={item.imageUrl} alt={item.name} className="size-20 rounded-lg bg-gray-50 object-contain p-1 text-2xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/product/${item.id}`} className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink no-underline hover:underline">
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Remove ${item.name}`}
                    className="grid size-8 flex-none cursor-pointer place-items-center rounded-md border-0 bg-transparent text-gray-500 hover:bg-gray-100"
                  >
                    ✕
                  </button>
                </div>
                <p className="m-0 text-sm text-gray-500">
                  {formatPrice(item.price)} each
                  {item.inStock === false && <span className="ml-2 font-semibold text-red-700">Out of stock</span>}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <QtyStepper product={item} qty={item.qty} className="h-9 w-32" />
                  <span className="text-base font-bold">{formatPrice(item.qty * item.price)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-2xl border border-gray-200 p-5 lg:sticky lg:top-28">
          <h2 className="m-0 mb-4 text-lg font-bold">Bill summary</h2>
          <dl className="m-0 space-y-2 text-[15px]">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-gray-600">
                <dt className="min-w-0 truncate">
                  {item.name} × {item.qty}
                </dt>
                <dd className="m-0 whitespace-nowrap">{formatPrice(item.qty * item.price)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 text-lg font-bold">
              <dt>
                Total <span className="text-sm font-medium text-gray-500">({count} {count === 1 ? 'item' : 'items'})</span>
              </dt>
              <dd className="m-0">{formatPrice(total)}</dd>
            </div>
          </dl>
          {outOfStock > 0 && (
            <p className="mt-3 mb-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {outOfStock} {outOfStock === 1 ? 'item is' : 'items are'} out of stock — we’ll confirm on WhatsApp.
            </p>
          )}
          <p className="mt-3 mb-0 text-xs text-gray-500">Final price and delivery are confirmed on WhatsApp.</p>

          <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-4 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:mt-5 lg:border-0 lg:p-0">
            <div className="flex flex-col leading-tight lg:hidden">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-xl font-bold whitespace-nowrap">{formatPrice(total)}</span>
            </div>
            <a
              href={cartWhatsappLink(items, total)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-buy font-semibold text-white no-underline hover:bg-buy-dark lg:w-full"
            >
              <WhatsAppIcon /> Order on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
