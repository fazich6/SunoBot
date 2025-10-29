'use client';

import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import { SunoBotLogo } from '@/components/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If the user is logged in but tries to access login/signup, redirect them away.
    if (!isUserLoading && user && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/chat');
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse">
            <SunoBotLogo />
        </div>
      </div>
    );
  }

  // If the user is not logged in, only show the login/signup pages.
  // For any other page, show the LoginPage.
  if (!user) {
    if (pathname === '/login' || pathname === '/signup') {
        return <>{children}</>;
    }
    return <LoginPage />;
  }

  // If user is logged in, but on login/signup page, show a loader while redirecting.
  if (pathname === '/login' || pathname === '/signup') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
      )
  }

  return <>{children}</>;
}
