import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'SunoBot',
  description: 'Your Urdu + English AI Assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
