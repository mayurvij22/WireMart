import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { addCategory, reindexProducts, renameCategory } from '../../lib/catalog';
import { friendlyError } from '../../lib/format';
import { ErrorBox, Spinner } from '../../components/Status';

export default function Categories() {
  const { categories, loading, error: loadError, refresh, setCategories } = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reindex, setReindex] = useState('');

  const exists = (name, exceptId) =>
    categories.some((c) => c.id !== exceptId && c.name.toLowerCase() === name.trim().toLowerCase());

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (exists(newName)) return setError(`"${newName.trim()}" already exists.`);
    run(async () => {
      const { list } = await addCategory(newName);
      setCategories(list);
      setNewName('');
    });
  }

  function saveRename(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    if (exists(editName, editingId)) return setError(`"${editName.trim()}" already exists.`);
    run(async () => {
      setCategories(await renameCategory(editingId, editName));
      setEditingId(null);
    });
  }

  function runReindex() {
    if (!window.confirm('Update search for all products? This uses 1 read + 1 write per product.')) return;
    run(async () => {
      setReindex('Starting…');
      const count = await reindexProducts((done, total) => setReindex(`Updated ${done} of ${total}…`));
      setReindex(`Search updated for ${count} products.`);
    });
  }

  return (
    <div className="admin-narrow">
      <h1>Categories</h1>

      <form className="inline-form" onSubmit={add}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" aria-label="New category name" />
        <button type="submit" className="btn btn-primary" disabled={busy || !newName.trim()}>
          Add
        </button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading && categories.length === 0 && <Spinner />}
      <ErrorBox error={loadError} onRetry={() => refresh(true)} />

      <ul className="admin-list">
        {categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="admin-row">
              <form className="inline-form grow" onSubmit={saveRename}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus aria-label="Category name" />
                <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
                  Save
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            </li>
          ) : (
            <li key={c.id} className="admin-row">
              <strong className="grow">{c.name}</strong>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setEditingId(c.id);
                  setEditName(c.name);
                  setError('');
                }}
              >
                Rename
              </button>
            </li>
          )
        )}
      </ul>

      {!loading && !loadError && categories.length === 0 && (
        <p className="empty">No categories yet. Type a name above (e.g. “Switches”) and tap Add.</p>
      )}

      {categories.length > 0 && (
        <button type="button" className="btn btn-ghost btn-block" onClick={() => refresh(true)}>
          ↻ Refresh list
        </button>
      )}

      <section className="mt-8 border-t border-gray-200 pt-4">
        <h2>Search</h2>
        <p className="muted">
          Customers can search by product name, category and features (series, code, rating). After renaming a
          category, or once for products added before this update, tap below so search picks up the changes.
        </p>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={runReindex}>
          🔍 Update search for all products
        </button>
        {reindex && <p className="muted" role="status">{reindex}</p>}
      </section>
    </div>
  );
}
