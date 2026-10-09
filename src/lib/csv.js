/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  text = text.replace(/^﻿/, '');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export const CSV_COLUMNS = ['name', 'price', 'category', 'features', 'imageUrl', 'description', 'inStock'];

export const CSV_TEMPLATE =
  'name,price,category,features,imageUrl,description,inStock\n' +
  '"Anchor Roma 6A Switch",45,Switches,"6 Amp|White|ISI marked",https://example.com/switch.jpg,"Modular one-way switch",yes\n' +
  '"Havells 1.5 sq mm Wire (90 m)",1450,Wires & Cables,"FR PVC|90 metre coil|Red",,"House wiring cable",yes\n';

const NO = new Set(['no', 'n', 'false', '0', 'out', 'out of stock']);

/** Converts CSV text into product rows plus a list of per-line problems. */
export function csvToProducts(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return { products: [], errors: ['The file is empty.'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.indexOf(c.toLowerCase())]));
  if (col.name < 0 || col.price < 0 || col.category < 0) {
    return { products: [], errors: ['The first row must contain at least: name, price, category'] };
  }

  const get = (r, c) => (col[c] >= 0 ? (r[col[c]] || '').trim() : '');
  const products = [];
  const errors = [];

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const name = get(r, 'name');
    const price = Number(get(r, 'price').replace(/[₹,\s]/g, ''));
    const categoryName = get(r, 'category');
    if (!name) return errors.push(`Line ${line}: missing name`);
    if (!Number.isFinite(price) || price < 0 || get(r, 'price') === '') return errors.push(`Line ${line}: invalid price`);
    if (!categoryName) return errors.push(`Line ${line}: missing category`);
    products.push({
      name: name.slice(0, 200),
      price,
      categoryName: categoryName.slice(0, 80),
      features: get(r, 'features').split('|').map((f) => f.trim()).filter(Boolean).slice(0, 50),
      imageUrl: get(r, 'imageUrl'),
      description: get(r, 'description').slice(0, 5000),
      inStock: !NO.has(get(r, 'inStock').toLowerCase()),
    });
  });

  return { products, errors };
}
