import { whatsappLink } from '../lib/format';

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

/** Opens WhatsApp with a pre-filled order message. Out-of-stock items become an enquiry. */
export default function BuyButton({ product, className = '' }) {
  return (
    <a
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg font-semibold no-underline transition active:scale-[0.98] ${
        product.inStock ? 'bg-buy text-white hover:bg-buy-dark' : 'border border-buy bg-white text-buy hover:bg-emerald-50'
      } ${className}`}
      href={whatsappLink(product)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <WhatsAppIcon />
      {product.inStock ? 'Buy Now' : 'Ask on WhatsApp'}
    </a>
  );
}
