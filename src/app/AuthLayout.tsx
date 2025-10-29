'use client';

import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import { SunoBotLogo } from '@/components/icons';
import { usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse">
            <SunoBotLogo />
        </div>
      </div>
    );
  }

  // If the user is not logged in, only show the login/signup pages
  if (!user) {
    if (pathname === '/login' || pathname === '/signup') {
        return <>{children}</>;
    }
    return <LoginPage />;
  }

  // If the user is logged in but tries to access login/signup, redirect them
  // This will be handled by the redirect in the root page.tsx for now.
  if (pathname === '/login' || pathname === '/signup') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
      )
  }

  return <>{children}</>;
}
