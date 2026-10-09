export default function StockBadge({ inStock }) {
  return (
    <span className={`badge ${inStock ? 'badge-in' : 'badge-out'}`}>
      {inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  );
}
