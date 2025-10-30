import './globals.css';
import { ReactNode } from 'react';
import { FirebaseClientProvider } from '@/firebase';
import AppLayout from '@/components/AppLayout';
import AuthLayout from './AuthLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'SunoBot',
  description: 'Your Urdu + English AI Assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FirebaseClientProvider>
          <ThemeProvider>
            <AuthLayout>
              <AppLayout>
                {children}
              </AppLayout>
            </AuthLayout>
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
