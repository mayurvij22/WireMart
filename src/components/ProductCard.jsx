import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/format';
import AddToCart from './AddToCart';
import BuyButton from './BuyButton';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';

export default function ProductCard({ product }) {
  return (
    <article className="group flex flex-col">
      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col text-ink no-underline">
        <div className="overflow-hidden rounded-xl bg-gray-50">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="aspect-square w-full object-contain p-3 text-4xl transition duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="m-0 mt-3 line-clamp-2 text-[15px] font-semibold leading-snug group-hover:underline">{product.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold">{formatPrice(product.price)}</span>
          <StockBadge inStock={product.inStock} />
        </div>
        {product.features.length > 0 && (
          <ul className="m-0 mt-2 list-none space-y-0.5 p-0 text-xs text-gray-500">
            {product.features.slice(0, 2).map((f, i) => (
              <li key={i} className="truncate">
                • {f}
              </li>
            ))}
          </ul>
        )}
      </Link>
      {product.inStock ? (
        <AddToCart product={product} className="mt-3 h-10 text-sm" />
      ) : (
        <BuyButton product={product} className="mt-3 h-10 text-sm" />
      )}
    </article>
  );
}
