import { useCart } from '../hooks/useCart';

/** "+ Add" until the product is in the cart, then a − qty + stepper. */
export function QtyStepper({ product, qty, className = '' }) {
  const { setQty } = useCart();
  const btn =
    'grid h-full w-10 flex-none cursor-pointer place-items-center border-0 bg-transparent text-lg font-bold text-accent hover:bg-accent-soft';
  return (
    <div className={`flex items-stretch overflow-hidden rounded-lg border border-accent bg-white ${className}`}>
      <button type="button" className={btn} aria-label={`Remove one ${product.name}`} onClick={() => setQty(product, qty - 1)}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={qty}
        aria-label={`Quantity of ${product.name}`}
        onFocus={(e) => e.target.select()}
        onChange={(e) => e.target.value !== '' && setQty(product, e.target.value)}
        className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-center font-bold text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" className={btn} aria-label={`Add one more ${product.name}`} onClick={() => setQty(product, qty + 1)}>
        +
      </button>
    </div>
  );
}

export default function AddToCart({ product, className = '' }) {
  const { qtyOf, add } = useCart();
  const qty = qtyOf(product.id);

  if (qty > 0) return <QtyStepper product={product} qty={qty} className={className} />;
  return (
    <button
      type="button"
      onClick={() => add(product)}
      className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent bg-white font-semibold text-accent transition hover:bg-accent-soft active:scale-[0.98] ${className}`}
    >
      <span aria-hidden="true" className="text-lg leading-none">+</span> Add to cart
    </button>
  );
}
