'use client';

import {
  User, // The User type from Firebase Auth
  onAuthStateChanged, // The listener for auth state
} from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/provider'; // Ensure this path is correct

/**
 * Interface for the return value of the useUser hook.
 */
export interface UserAuthHookResult {
  user: User | null;       // The Firebase User object, or null if not logged in.
  isUserLoading: boolean;  // True while the initial auth state is being determined.
  userError: Error | null; // Any error that occurred during auth state listening.
}

/**
 * React hook to get the current authenticated user's state.
 * It manages the user object, loading status, and any potential errors
 * from the Firebase Authentication listener.
 *
 * @returns {UserAuthHookResult} An object containing the user, loading state, and error.
 */
export const useUser = (): UserAuthHookResult => {
  const auth = useAuth(); // Get the auth instance from your provider context.

  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true); // Start as true
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      // If the auth instance is not ready, we can't determine the user.
      // This might happen briefly on initial load.
      setIsUserLoading(false); // No longer loading, but no user.
      return;
    }

    // Set loading to true when the listener is being set up.
    setIsUserLoading(true);

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        // This callback is triggered on sign-in, sign-out, or initial load.
        setUser(firebaseUser);
        setIsUserLoading(false); // Auth state has been determined.
        setUserError(null);      // Clear any previous error.
      },
      (error) => {
        // This callback is triggered if the listener itself fails.
        console.error('useUser: onAuthStateChanged error:', error);
        setUserError(error);
        setIsUserLoading(false); // Stop loading, an error occurred.
        setUser(null);
      }
    );

    // Cleanup: The returned function will be called when the component unmounts.
    return () => unsubscribe();
  }, [auth]); // Re-run the effect if the auth instance changes.

  return { user, isUserLoading, userError };
};
