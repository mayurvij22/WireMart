import { useRouteError } from 'react-router-dom';

const RELOAD_FLAG = 'yp_reloaded_after_update';

// After a new deploy (or while developing), an open tab can ask for code files that no
// longer exist. One automatic reload fetches the new version.
function isStaleCodeError(error) {
  const msg = String(error?.message || error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch/i.test(msg);
}

export default function RouteError() {
  const error = useRouteError();

  if (isStaleCodeError(error)) {
    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
      if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch {
      // Storage blocked: fall through to the manual button.
    }
    if (!alreadyReloaded) {
      window.location.reload();
      return null;
    }
  }

  return (
    <main className="page narrow">
      <div className="empty">
        <h1>Something went wrong</h1>
        <p>Please reload the page. If it keeps happening, check your internet connection.</p>
        <button
          type="button"
          className="btn btn-primary btn-large"
          onClick={() => {
            try {
              sessionStorage.removeItem(RELOAD_FLAG);
            } catch {
              // ignore
            }
            window.location.reload();
          }}
        >
          Reload
        </button>
        {import.meta.env.DEV && <pre className="error-detail">{String(error?.stack || error?.message || error)}</pre>}
      </div>
    </main>
  );
}
