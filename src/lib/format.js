import { CART_ORDER_MESSAGE, ENQUIRY_MESSAGE, ORDER_MESSAGE, WHATSAPP_NUMBER } from '../config';

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

// Firestore rules allow at most 400 keywords per product.
const MAX_KEYWORDS = 400;
const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'of', 'in', 'to', 'or']);
// Short words that belong to the number before them: "10 a" → "10a", "1 way" → "1way".
const UNIT = /^(a|amp|amps|w|v|mm|m|sq|way|gang|pin|module|modules|pcs|pc|hp|kw|inch|in|ft)$/;

// Plural → singular for English words, so "switches" finds "Switch" and "plate" finds "Plates".
export function stem(word) {
  if (word.length < 4 || !/^[a-z]+$/.test(word)) return word;
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (/(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

// Joined forms: "1 Way" → "1way", "Wood-em" → "woodem", "Four-X" → "fourx".
function joinedWords(text, words) {
  const out = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (/^\d+$/.test(words[i]) && UNIT.test(words[i + 1])) out.push(words[i] + words[i + 1]);
  }
  for (const chunk of (text || '').toLowerCase().split(/\s+/)) {
    const parts = tokenize(chunk);
    if (parts.length > 1) out.push(parts.join('').slice(0, MAX_TOKEN));
  }
  return out;
}

/** Normalised words of a search query (plurals folded, "1 way" joined, filler words dropped). */
export function searchTerms(text) {
  const words = tokenize(text);
  const terms = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (/^\d+$/.test(w) && UNIT.test(words[i + 1] || '')) {
      terms.push(w + words[++i]);
    } else if (!STOPWORDS.has(w)) {
      terms.push(stem(w));
    }
  }
  return [...new Set(terms)];
}

/**
 * Every prefix of every word in the name, category and feature values, so "sw", "switches",
 * "plana", "w90001" or "1way" all find "Fybros Wood-em Plana 1 Way Switch" in Switches.
 * The name comes first so it is never dropped by the 400-keyword limit.
 */
export function buildKeywords(name, extras = []) {
  const set = new Set();
  // Feature lines look like "Series: Plana" — only the value is worth indexing.
  const texts = [name, ...extras.map((t) => String(t || '').replace(/^[^:]{1,30}:\s*/, ''))];
  for (const text of texts) {
    const words = tokenize(text);
    const all = [...words, ...words.map(stem), ...joinedWords(text, words)];
    for (const word of all) {
      if (STOPWORDS.has(word)) continue;
      for (let i = 1; i <= word.length; i++) {
        if (set.size >= MAX_KEYWORDS) return [...set];
        set.add(word.slice(0, i));
      }
    }
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

/** WhatsApp order for the whole cart: one bill line per item plus the grand total. */
export function cartWhatsappLink(items, total) {
  const lines = items.map(
    (i, n) =>
      `${n + 1}. ${i.name}\n    ${i.qty} × ${formatPrice(i.price)} = ${formatPrice(i.qty * i.price)}` +
      (i.inStock === false ? ' (out of stock?)' : '')
  );
  const text = CART_ORDER_MESSAGE.replace('{items}', lines.join('\n')).replace('{total}', formatPrice(total));
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
