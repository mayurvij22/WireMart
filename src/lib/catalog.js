import {
  addDoc,
  collection,
  deleteDoc,
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
import { buildKeywords, normalizeImageUrl, searchTerms } from './format';

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
    description: (input.description || '').trim(),
    inStock: Boolean(input.inStock),
    updatedAt: serverTimestamp(),
  };
}

async function lookupCategoryName(id) {
  return (await getCategories()).find((c) => c.id === id)?.name || '';
}

export async function saveProduct(id, input) {
  const data = productData(input, await lookupCategoryName(input.category));
  if (id) {
    await updateDoc(doc(db, 'products', id), data);
  } else {
    const ref = await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
    id = ref.id;
  }
  clearListCache();
  return id;
}

export async function setProductStock(id, inStock) {
  await updateDoc(doc(db, 'products', id), { inStock, updatedAt: serverTimestamp() });
  patchCachedProduct(id, { inStock });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id));
  patchCachedProduct(id, null);
}

/**
 * Bulk import parsed CSV rows: { name, price, categoryName, features[], imageUrl, description, inStock }.
 * Missing categories are created first. Writes go in batches of 400.
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

  const BATCH = 400;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const row of rows.slice(i, i + BATCH)) {
      const data = productData({ ...row, category: idByName.get(row.categoryName.toLowerCase()) }, row.categoryName);
      batch.set(doc(collection(db, 'products')), { ...data, createdAt: serverTimestamp() });
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
