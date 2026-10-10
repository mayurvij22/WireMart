import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'yp_cart_v1';
const MAX_QTY = 999;

const CartContext = createContext(null);

function readCart() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}

// Keep only what the cart needs. Embedded photos (data URLs) are too big for localStorage.
function snapshot(product) {
  const imageUrl = product.imageUrl?.startsWith('data:') ? '' : product.imageUrl || '';
  return { id: product.id, name: product.name, price: Number(product.price) || 0, imageUrl, inStock: product.inStock };
}

const clampQty = (n) => Math.max(0, Math.min(MAX_QTY, Math.floor(Number(n) || 0)));

/** Shopping cart shared by the customer pages; survives reloads via localStorage. */
export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — the cart still works for this visit.
    }
  }, [items]);

  // Another tab changed the cart.
  useEffect(() => {
    const onStorage = (e) => e.key === STORAGE_KEY && setItems(readCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setQty = useCallback((product, qty) => {
    const n = clampQty(qty);
    setItems((list) => {
      const exists = list.some((i) => i.id === product.id);
      if (n === 0) return list.filter((i) => i.id !== product.id);
      if (exists) return list.map((i) => (i.id === product.id ? { ...i, ...snapshot({ ...i, ...product }), qty: n } : i));
      return [...list, { ...snapshot(product), qty: n }];
    });
  }, []);

  const value = useMemo(() => {
    const qtyById = Object.fromEntries(items.map((i) => [i.id, i.qty]));
    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      total: items.reduce((sum, i) => sum + i.qty * i.price, 0),
      qtyOf: (id) => qtyById[id] || 0,
      setQty,
      add: (product, by = 1) => setQty(product, (qtyById[product.id] || 0) + by),
      remove: (product) => setQty(product, 0),
      clear: () => setItems([]),
    };
  }, [items, setQty]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used inside <CartProvider>');
  return cart;
}
