import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="m-0 text-3xl font-bold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-white no-underline">
        Go to products
      </Link>
    </div>
  );
}
