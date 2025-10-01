'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Settings = {
  theme?: 'light' | 'dark' | 'system';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'settings', user.uid) : null),
    [user, firestore]
  );
  const { data: settings } = useDoc<Settings>(settingsDocRef);

  useEffect(() => {
    const theme = settings?.theme || 'system';
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [settings]);

  return <>{children}</>;
}
