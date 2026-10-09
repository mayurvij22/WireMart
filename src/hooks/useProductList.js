import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProductsPage, listCache, listKey } from '../lib/catalog';

const EMPTY = { items: [], cursor: null, hasMore: true, loaded: false };

/** Paginated product list for a category/search, backed by the shared list cache. */
export function useProductList({ categoryId, search }) {
  const key = listKey(categoryId, search);
  const keyRef = useRef(key);
  const [state, setState] = useState(() => listCache.get(key) || EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (base) => {
      setLoading(true);
      setError(null);
      try {
        const page = await fetchProductsPage({ categoryId, search, cursor: base.cursor });
        const next = {
          items: base.items.concat(page.items),
          cursor: page.cursor,
          hasMore: page.hasMore,
          loaded: true,
        };
        listCache.set(key, next);
        if (keyRef.current === key) setState(next);
      } catch (e) {
        if (keyRef.current === key) setError(e);
      } finally {
        if (keyRef.current === key) setLoading(false);
      }
    },
    // key already encodes categoryId + search
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  useEffect(() => {
    keyRef.current = key;
    const cached = listCache.get(key);
    if (cached) {
      setState(cached);
      setLoading(false);
    } else {
      setState(EMPTY);
      load(EMPTY);
    }
  }, [key, load]);

  const loadMore = () => {
    if (!loading && state.hasMore) load(state);
  };

  // Re-read from cache after an in-place edit (stock toggle, delete).
  const sync = () => setState(listCache.get(key) || EMPTY);

  return { ...state, loading, error, loadMore, sync, retry: () => load(state) };
}
