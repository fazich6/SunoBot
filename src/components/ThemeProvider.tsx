'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type Settings = {
  theme?: 'light' | 'dark' | 'system';
};

// This is a client-side only script that runs before the page is hydrated.
// We are not using dangerouslySetInnerHTML, but a simple script tag.
const themeSetterScript = `
(function() {
  try {
    const theme = localStorage.getItem('sunobot-theme') || 'system';
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  } catch (e) {
    console.error('Failed to set theme from localStorage', e);
  }
})();
`;


export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'settings', user.uid) : null),
    [user, firestore]
  );
  const { data: settings } = useDoc<Settings>(settingsDocRef);

  useEffect(() => {
    if (settings?.theme) {
      // When settings load from Firestore, update localStorage
      localStorage.setItem('sunobot-theme', settings.theme);
      
      const theme = settings.theme;
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }
  }, [settings]);

  return (
    <>
      {/* This script runs immediately on the client before React hydrates */}
      <script dangerouslySetInnerHTML={{ __html: themeSetterScript }} />
      {children}
    </>
  );
}
