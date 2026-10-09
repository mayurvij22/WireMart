import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, useAuthUser } from './auth';
import { Spinner } from '../components/Status';
import Login from './pages/Login';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import ImportProducts from './pages/ImportProducts';

const links = [
  { to: '/admin', label: 'Products', icon: '📦', end: true },
  { to: '/admin/new', label: 'Add Product', short: '+ Add', icon: '➕' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/import', label: 'Import CSV', short: 'Import', icon: '📥' },
];

export default function AdminApp() {
  const user = useAuthUser();

  if (user === undefined) return <Spinner />;
  if (!user) return <Login />;

  return (
    <div className="admin">
      <header className="topbar admin-topbar">
        <span className="brand">
          <span className="brand-bolt" aria-hidden="true">⚡</span> Admin
        </span>
        <div className="admin-topbar-actions">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-light btn-small view-shop">
            View shop ↗
          </a>
          <button type="button" className="btn btn-ghost btn-light btn-small" onClick={() => signOut(auth)}>
            Log out
          </button>
        </div>
      </header>
      <nav className="admin-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <span className="nav-icon" aria-hidden="true">{l.icon}</span>
            <span className="nav-label-long">{l.label}</span>
            <span className="nav-label-short">{l.short || l.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="page admin-main">
        <Routes>
          <Route index element={<ProductList />} />
          <Route path="new" element={<ProductForm />} />
          <Route path="edit/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="import" element={<ImportProducts />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
