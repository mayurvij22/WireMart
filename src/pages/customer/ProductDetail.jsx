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
      <div className="empty">
        <p>This product is no longer available.</p>
        <Link to="/" className="btn btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  const category = byId[product.category];

  return (
    <article className="detail">
      <button type="button" className="btn btn-ghost back" onClick={goBack}>
        ← Back
      </button>

      <div className="detail-media">
        <ProductImage src={product.imageUrl} alt={product.name} className="detail-img" />
      </div>

      <div className="detail-body">
        {category && (
          <Link to={`/?cat=${category.id}`} className="detail-category">
            {category.name}
          </Link>
        )}
        <h1 className="detail-title">{product.name}</h1>
        <div className="detail-price">{formatPrice(product.price)}</div>
        <StockBadge inStock={product.inStock} />

        {/* Phones: fixed bar at the bottom. Computers: shown here beside the photo. */}
        <div className="buy-bar">
          <div className="buy-bar-price">{formatPrice(product.price)}</div>
          <BuyButton product={product} className="btn-large" />
        </div>

        {product.features.length > 0 && (
          <section>
            <h2 className="section-title">Features</h2>
            <ul className="feature-list">
              {product.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {product.description && (
          <section>
            <h2 className="section-title">Description</h2>
            <p className="detail-desc">{product.description}</p>
          </section>
        )}
      </div>
    </article>
  );
}
