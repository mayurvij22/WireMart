import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { isFirebaseConfigured } from './firebase';
import { Spinner } from './components/Status';
import RouteError from './components/RouteError';
import CustomerLayout from './pages/customer/CustomerLayout';
import Home from './pages/customer/Home';
import ProductDetail from './pages/customer/ProductDetail';
import NotFound from './pages/customer/NotFound';

// Admin code (incl. Firebase Auth) is a separate chunk customers never download.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function Root() {
  if (!isFirebaseConfigured) {
    return (
      <main className="page narrow">
        <h1>Setup needed</h1>
        <p>
          Firebase environment variables are missing. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code> (or add them in Vercel → Settings → Environment Variables) and rebuild.
        </p>
      </main>
    );
  }
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/admin/*',
        element: (
          <Suspense fallback={<Spinner />}>
            <AdminApp />
          </Suspense>
        ),
      },
      {
        element: <CustomerLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/product/:id', element: <ProductDetail /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
