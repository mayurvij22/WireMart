import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories, peekCategories } from '../lib/catalog';

export function useCategories() {
  const [categories, setCategories] = useState(() => peekCategories() || []);
  const [loading, setLoading] = useState(() => !peekCategories());
  const [error, setError] = useState(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getCategories({ force }));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byId = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  return { categories, byId, loading, error, refresh, setCategories };
}
