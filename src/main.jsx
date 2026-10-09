import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

// Allow RouteError to auto-reload again later in this session once this load has settled.
setTimeout(() => {
  try {
    sessionStorage.removeItem('yp_reloaded_after_update');
  } catch {
    // ignore
  }
}, 10000);
