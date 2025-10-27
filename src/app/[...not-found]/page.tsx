'use server';

import MainApp from '../main';

// This is a catch-all route that ensures that any direct navigation
// to a client-side route (e.g., /chat, /profile) will render the main app.
export default function NotFound() {
  return <MainApp />;
}
