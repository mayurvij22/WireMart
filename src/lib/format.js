import { ENQUIRY_MESSAGE, ORDER_MESSAGE, WHATSAPP_NUMBER } from '../config';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function formatPrice(price) {
  return `₹${inr.format(Number(price) || 0)}`;
}

const MAX_TOKEN = 20;

// Splits text into lowercase words (works for English, Hindi and Marathi).
export function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
    .map((t) => t.slice(0, MAX_TOKEN));
}

// Every prefix of every word, so "sw" or "switch" both find "Anchor Modular Switch".
export function buildKeywords(name) {
  const set = new Set();
  for (const word of tokenize(name)) {
    for (let i = 1; i <= word.length; i++) set.add(word.slice(0, i));
  }
  return [...set];
}

// Google Drive "share" links (…/file/d/<id>/view, …open?id=<id>) are web pages, not images.
// Convert them to Drive's thumbnail link, which loads as a normal <img>.
export function normalizeImageUrl(url) {
  const clean = (url || '').trim();
  if (!/^https?:\/\/(drive|docs)\.google\.com\//.test(clean)) return clean;
  const id = clean.match(/\/d\/([\w-]{20,})/)?.[1] || clean.match(/[?&]id=([\w-]{20,})/)?.[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w800` : clean;
}

export function whatsappLink(product) {
  const text = (product.inStock ? ORDER_MESSAGE : ENQUIRY_MESSAGE)
    .replace('{name}', product.name)
    .replace('{price}', formatPrice(product.price));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function friendlyError(err) {
  if (!err) return '';
  if (err.code === 'permission-denied') {
    return 'Permission denied. Make sure you are logged in as the admin and the UID in firestore.rules is correct.';
  }
  if (err.code === 'unavailable') return 'No internet connection. Please try again.';
  if (err.code === 'resource-exhausted') return 'Daily free limit reached. Please try again tomorrow.';
  // Missing-index errors include a console link that creates the index.
  return err.message || String(err);
}
