import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import BuyButton from './BuyButton';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';

export default function ProductCard({ product }) {
  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-link">
        <ProductImage src={product.imageUrl} alt={product.name} className="card-img" />
        <div className="card-body">
          <h3 className="card-title">{product.name}</h3>
          <div className="card-price">{formatPrice(product.price)}</div>
          <StockBadge inStock={product.inStock} />
          {product.features.length > 0 && (
            <ul className="card-features">
              {product.features.slice(0, 3).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      </Link>
      <div className="card-actions">
        <BuyButton product={product} />
      </div>
    </article>
  );
}
