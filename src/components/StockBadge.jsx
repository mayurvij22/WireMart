export default function StockBadge({ inStock }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
        inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {inStock ? 'In stock' : 'Out of stock'}
    </span>
  );
}
