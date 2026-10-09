import { useMemo, useState } from 'react';
import { CSV_TEMPLATE, csvToProducts } from '../../lib/csv';
import { importProducts } from '../../lib/catalog';
import { formatPrice, friendlyError } from '../../lib/format';

// Spark plan allows 20,000 writes per day; leave room for normal edits.
const MAX_PER_DAY = 18000;

export default function ImportProducts() {
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const parsed = useMemo(() => (text.trim() ? csvToProducts(text) : null), [text]);
  const templateHref = useMemo(() => URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' })), []);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone('');
    setError('');
    setText(await file.text());
  }

  async function runImport() {
    const rows = parsed.products;
    if (!window.confirm(`Import ${rows.length} products? Products already in the catalog will be added again (no duplicate check).`)) return;
    setError('');
    setDone('');
    setProgress(0);
    try {
      const count = await importProducts(rows, setProgress);
      setDone(`Imported ${count} products.`);
      setText('');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setProgress(null);
    }
  }

  const tooMany = parsed && parsed.products.length > MAX_PER_DAY;

  return (
    <div className="admin-narrow">
      <h1>Import Products (CSV)</h1>
      <p className="muted">
        Make a sheet in Excel or Google Sheets with columns <code>name, price, category, features, imageUrl,
        description, inStock</code>, then save it as CSV. Separate features with <code>|</code>. Missing categories
        are created automatically.
      </p>
      <a href={templateHref} download="products-template.csv" className="btn btn-secondary btn-block">
        Download template
      </a>

      <label className="btn btn-primary btn-block btn-large file-btn">
        Choose CSV file
        <input type="file" accept=".csv,text/csv" onChange={onFile} hidden />
      </label>

      {done && <div className="flash">{done}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {parsed && (
        <section>
          <h2 className="section-title">
            {parsed.products.length} products ready
            {parsed.errors.length > 0 && `, ${parsed.errors.length} rows skipped`}
          </h2>

          {parsed.errors.length > 0 && (
            <ul className="import-errors">
              {parsed.errors.slice(0, 20).map((e) => (
                <li key={e}>{e}</li>
              ))}
              {parsed.errors.length > 20 && <li>…and {parsed.errors.length - 20} more</li>}
            </ul>
          )}

          <ul className="admin-list">
            {parsed.products.slice(0, 5).map((p, i) => (
              <li key={i} className="admin-row">
                <div className="admin-row-info">
                  <strong>{p.name}</strong>
                  <span>
                    {formatPrice(p.price)} · {p.categoryName}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {parsed.products.length > 5 && <p className="muted">…and {parsed.products.length - 5} more</p>}

          {tooMany && (
            <p className="form-error">
              The free plan allows about 20,000 writes per day. Split this file and import at most {MAX_PER_DAY} rows per day.
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block btn-large"
            disabled={progress !== null || tooMany || parsed.products.length === 0}
            onClick={runImport}
          >
            {progress !== null ? `Importing… ${progress}/${parsed.products.length}` : `Import ${parsed.products.length} products`}
          </button>
        </section>
      )}
    </div>
  );
}
