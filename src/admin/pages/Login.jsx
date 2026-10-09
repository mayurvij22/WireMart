import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../auth';
import { ADMIN_LOGIN_DOMAIN, SHOP_NAME } from '../../config';

const messages = {
  'auth/invalid-credential': 'Wrong username or password.',
  'auth/invalid-email': 'Username can only use letters, numbers, dots, dashes or underscores.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection.',
};

// Firebase only supports email logins, so a plain username like "yogesh"
// is turned into "yogesh@<ADMIN_LOGIN_DOMAIN>" behind the scenes.
function toLoginEmail(username) {
  const name = username.trim().toLowerCase();
  return name.includes('@') ? name : `${name}@${ADMIN_LOGIN_DOMAIN}`;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, toLoginEmail(username), password);
    } catch (err) {
      setError(messages[err.code] || err.message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="form login-card">
        <div className="login-head">
          <span className="brand-bolt" aria-hidden="true">⚡</span>
          <div>
            <h1>Admin Login</h1>
            <p className="muted">{SHOP_NAME}</p>
          </div>
        </div>
        <label className="field">
          <span>Username</span>
          <input
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block btn-large" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
