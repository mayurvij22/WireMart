import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase';

export const auth = getAuth(app);

/** undefined while checking, null when signed out, the user otherwise. */
export function useAuthUser() {
  const [user, setUser] = useState(auth.currentUser ?? undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}
