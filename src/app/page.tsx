'use server';

import MainApp from './main';

// This is the main entry point for the application.
// It's a server component that renders the main client-side app.
export default function Home() {
  return <MainApp />;
}
