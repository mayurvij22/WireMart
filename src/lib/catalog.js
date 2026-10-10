import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore/lite';
import { db } from '../firebase';
import { CATEGORY_CACHE_HOURS, PAGE_SIZE } from '../config';
import { buildKeywords, normalizeImageUrl, searchTerms, tokenize } from './format';

/* ------------------------------------------------------------------ */
/* Categories: read once, then served from memory + localStorage.      */
/* ------------------------------------------------------------------ */

const CATEGORY_STORAGE_KEY = 'yp_categories_v1';
const CATEGORY_TTL_MS = CATEGORY_CACHE_HOURS * 60 * 60 * 1000;
let memCategories = null;

const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

function readStoredCategories() {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return null;
    const { at, list } = JSON.parse(raw);
    if (!Array.isArray(list) || Date.now() - at > CATEGORY_TTL_MS) return null;
    return list;
  } catch {
    return null;
  }
}

function storeCategories(list) {
  memCategories = [...list].sort(byName);
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify({ at: Date.now(), list: memCategories }));
  } catch {
    // Storage full or blocked — memory cache still works.
  }
  return memCategories;
}

/** Cached categories without hitting the network, or null. */
export function peekCategories() {
  if (!memCategories) memCategories = readStoredCategories();
  return memCategories;
}

export async function getCategories({ force = false } = {}) {
  if (!force) {
    const cached = peekCategories();
    if (cached) return cached;
  }
  const snap = await getDocs(collection(db, 'categories'));
  return storeCategories(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
}

export async function addCategory(name) {
  const clean = name.trim();
  const ref = await addDoc(collection(db, 'categories'), { name: clean });
  const list = (await getCategories()).concat({ id: ref.id, name: clean });
  return { id: ref.id, list: storeCategories(list) };
}

// Products store the category *id*, so renaming is a single write.
export async function renameCategory(id, name) {
  const clean = name.trim();
  await updateDoc(doc(db, 'categories', id), { name: clean });
  const list = (await getCategories()).map((c) => (c.id === id ? { ...c, name: clean } : c));
  return storeCategories(list);
}

/* ------------------------------------------------------------------ */
/* Product lists: paginated with limit() + startAfter(), cached per    */
/* (category, search) so "Back" never re-reads what was already shown. */
/* ------------------------------------------------------------------ */

export const listCache = new Map();

export function listKey(categoryId, search) {
  return `${categoryId || ''}|${searchTerms(search).join(' ')}`;
}

export function clearListCache() {
  relatedCache.clear();
  listCache.clear();
}

export function patchCachedProduct(id, patch) {
  for (const [key, entry] of listCache) {
    const items = patch
      ? entry.items.map((p) => (p.id === id ? { ...p, ...patch } : p))
      : entry.items.filter((p) => p.id !== id);
    listCache.set(key, { ...entry, items });
  }
}

function findCachedProduct(id) {
  for (const entry of listCache.values()) {
    const hit = entry.items.find((p) => p.id === id);
    if (hit) return hit;
  }
  return null;
}

function toProduct(snap) {
  const d = snap.data();
  return {
    id: snap.id,
    name: d.name || '',
    price: d.price ?? 0,
    category: d.category || '',
    features: Array.isArray(d.features) ? d.features : [],
    imageUrl: d.imageUrl || '',
    morePhotos: Number.isInteger(d.morePhotos) ? d.morePhotos : 0,
    description: d.description || '',
    inStock: d.inStock !== false,
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
  };
}

/**
 * One page of products ordered by name.
 * Search uses the longest typed word in Firestore (array-contains on
 * `keywords`) and checks any other words on the phone.
 */
export async function fetchProductsPage({ categoryId, search, cursor }) {
  const terms = searchTerms(search);
  const main = terms.reduce((a, b) => (b.length > a.length ? b : a), '');
  const rest = terms.filter((t) => t !== main);

  const items = [];
  let hasMore = true;
  // Multi-word searches filter on the phone, so keep reading until a page is full (max 5 reads of PAGE_SIZE).
  for (let attempt = 0; attempt < 5 && hasMore && items.length < PAGE_SIZE; attempt++) {
    const constraints = [];
    if (categoryId) constraints.push(where('category', '==', categoryId));
    if (main) constraints.push(where('keywords', 'array-contains', main));
    constraints.push(orderBy('nameLower'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(PAGE_SIZE));

    const snap = await getDocs(query(collection(db, 'products'), ...constraints));
    const page = snap.docs.map(toProduct);
    items.push(...(rest.length ? page.filter((p) => rest.every((t) => p.keywords.includes(t))) : page));
    hasMore = snap.docs.length === PAGE_SIZE;
    if (snap.docs.length) cursor = snap.docs[snap.docs.length - 1];
    if (!rest.length) break;
  }
  return { items, cursor, hasMore };
}

export async function getProduct(id) {
  const cached = findCachedProduct(id);
  if (cached) return cached;
  const snap = await getDoc(doc(db, 'products', id));
  return snap.exists() ? toProduct(snap) : null;
}

/* ------------------------------------------------------------------ */
/* Admin writes                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Extra photos: the main photo lives on the product (so lists stay    */
/* light); up to MAX_EXTRA_PHOTOS more live in productPhotos/{id},      */
/* read only when a product page opens. Separate docs also keep each   */
/* one under Firestore's 1 MB limit with embedded photos.              */
/* ------------------------------------------------------------------ */

export const MAX_PHOTOS = 5;
const MAX_EXTRA_PHOTOS = MAX_PHOTOS - 1;
const photoCache = new Map();

const cleanPhotos = (list) =>
  (list || []).map((u) => normalizeImageUrl(u)).filter(Boolean).slice(0, MAX_EXTRA_PHOTOS);

/** The product's extra photos (not including the main `imageUrl`). Costs 1 read, then cached. */
export async function getMorePhotos(product) {
  if (!product?.morePhotos) return [];
  if (photoCache.has(product.id)) return photoCache.get(product.id);
  const snap = await getDoc(doc(db, 'productPhotos', product.id));
  const images = snap.exists() && Array.isArray(snap.data().images) ? snap.data().images : [];
  photoCache.set(product.id, images);
  return images;
}

function writePhotos(batch, id, extras) {
  const ref = doc(db, 'productPhotos', id);
  if (extras.length) batch.set(ref, { images: extras });
  else batch.delete(ref);
  photoCache.set(id, extras);
}

function productData(input, categoryName = '') {
  const name = input.name.trim();
  const features = (input.features || []).map((f) => f.trim()).filter(Boolean);
  return {
    name,
    nameLower: name.toLowerCase(),
    keywords: buildKeywords(name, [categoryName, ...features]),
    price: Number(input.price),
    category: input.category,
    features,
    imageUrl: normalizeImageUrl(input.imageUrl),
    morePhotos: cleanPhotos(input.moreImages).length,
    description: (input.description || '').trim(),
    inStock: Boolean(input.inStock),
    updatedAt: serverTimestamp(),
  };
}

async function lookupCategoryName(id) {
  return (await getCategories()).find((c) => c.id === id)?.name || '';
}

/** Saves a product. `input.moreImages` holds up to 4 photos besides the main `imageUrl`. */
export async function saveProduct(id, input) {
  const data = productData(input, await lookupCategoryName(input.category));
  const batch = writeBatch(db);
  if (id) {
    batch.update(doc(db, 'products', id), data);
  } else {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, { ...data, createdAt: serverTimestamp() });
    id = ref.id;
  }
  writePhotos(batch, id, cleanPhotos(input.moreImages));
  await batch.commit();
  clearListCache();
  return id;
}

export async function setProductStock(id, inStock) {
  await updateDoc(doc(db, 'products', id), { inStock, updatedAt: serverTimestamp() });
  patchCachedProduct(id, { inStock });
}

export async function deleteProduct(id) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'products', id));
  batch.delete(doc(db, 'productPhotos', id));
  await batch.commit();
  photoCache.delete(id);
  patchCachedProduct(id, null);
}

/**
 * Bulk import parsed CSV rows: { name, price, categoryName, features[], imageUrl, moreImages[], description, inStock }.
 * Missing categories are created first. Writes go in batches of 200 products (up to 2 writes each).
 */
export async function importProducts(rows, onProgress = () => {}) {
  const categories = await getCategories({ force: true });
  const idByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const row of rows) {
    const key = row.categoryName.toLowerCase();
    if (!idByName.has(key)) {
      const { id } = await addCategory(row.categoryName);
      idByName.set(key, id);
    }
  }

  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const row of rows.slice(i, i + BATCH)) {
      const data = productData({ ...row, category: idByName.get(row.categoryName.toLowerCase()) }, row.categoryName);
      const ref = doc(collection(db, 'products'));
      batch.set(ref, { ...data, createdAt: serverTimestamp() });
      const extras = cleanPhotos(row.moreImages);
      if (extras.length) batch.set(doc(db, 'productPhotos', ref.id), { images: extras });
    }
    await batch.commit();
    done = Math.min(i + BATCH, rows.length);
    onProgress(done);
  }
  clearListCache();
  return done;
}

/**
 * Rebuilds the search keywords of every product (after a category rename, or for
 * products saved before category/feature search existed). Costs 1 read + 1 write per product.
 */
export async function reindexProducts(onProgress = () => {}) {
  const categories = await getCategories({ force: true });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const snap = await getDocs(collection(db, 'products'));

  const BATCH = 400;
  let done = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const d of snap.docs.slice(i, i + BATCH)) {
      const p = toProduct(d);
      batch.update(d.ref, { keywords: buildKeywords(p.name, [nameById.get(p.category) || '', ...p.features]) });
    }
    await batch.commit();
    done = Math.min(i + BATCH, snap.docs.length);
    onProgress(done, snap.docs.length);
  }
  clearListCache();
  return done;
}

/* ------------------------------------------------------------------ */
/* Related products: other sizes / colours of the same model, then     */
/* similar items from the same category. Cached per product.           */
/* ------------------------------------------------------------------ */

const relatedCache = new Map();
const COLOUR_WORDS = /^(white|black|brown|grey|gray|gold|golden|silver|blue|red|green|ivory|cream|beige|chrome|wood|oakwood|walnut|matt|matte|glossy|pearl|smoke|rich|dark|light)$/;

/** The word most likely to identify the product line: Model/Series feature, else a distinctive name word. */
function lineWord(product) {
  const line = product.features.find((f) => /^(model|series)\s*:/i.test(f));
  if (line) {
    const value = line.replace(/^[^:]*:\s*/, '');
    const chunks = value.split(/\s+/).filter(Boolean);
    // A single hyphenated name like "Air-1" is indexed joined ("air1"); otherwise use its longest word.
    if (chunks.length === 1 && tokenize(value).length > 1) return tokenize(value).join('');
    const words = searchTerms(value);
    if (words.length) return words.reduce((a, b) => (b.length > a.length ? b : a));
  }
  const words = searchTerms(product.name)
    .slice(1) // first word is usually the brand
    .filter((w) => !/\d/.test(w) && !COLOUR_WORDS.test(w) && w.length > 2);
  return words.reduce((a, b) => (b.length > a.length ? b : a), '');
}

/** Words in `other`'s name that `product`'s name doesn't have, e.g. "1200mm · Matt White". */
export function variantLabel(product, other) {
  const mine = new Set(tokenize(product.name));
  const own = other.name.split(/\s+/).filter((w) => tokenize(w).some((t) => !mine.has(t)));
  return own.join(' ');
}

async function categoryPage(product, extra, max) {
  const constraints = [where('category', '==', product.category)];
  if (extra) constraints.push(where('keywords', 'array-contains', extra));
  constraints.push(orderBy('nameLower'), limit(max));
  const snap = await getDocs(query(collection(db, 'products'), ...constraints));
  return snap.docs.map(toProduct).filter((p) => p.id !== product.id);
}

/** { variants, similar } for a product page. Costs up to ~20 reads the first time, then 0. */
export async function getRelatedProducts(product) {
  if (relatedCache.has(product.id)) return relatedCache.get(product.id);
  if (!product.category) return { variants: [], similar: [] };

  const word = lineWord(product);
  const variants = word ? await categoryPage(product, word, 13) : [];
  // Closest names first: most shared words with this product.
  const mine = new Set(tokenize(product.name));
  const shared = (p) => tokenize(p.name).filter((t) => mine.has(t)).length;
  variants.sort((a, b) => shared(b) - shared(a));

  let similar = [];
  if (variants.length < 8) {
    const seen = new Set(variants.map((p) => p.id));
    similar = (await categoryPage(product, '', 9)).filter((p) => !seen.has(p.id)).slice(0, 8);
  }
  const result = { variants: variants.slice(0, 12), similar };
  relatedCache.set(product.id, result);
  return result;
}
