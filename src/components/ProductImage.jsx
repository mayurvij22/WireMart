import { useState } from 'react';

export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`img-placeholder ${className}`} role="img" aria-label={alt}>
        <span aria-hidden="true">⚡</span>
      </div>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
