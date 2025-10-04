'use client';

import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import { SunoBotLogo } from '@/components/icons';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse">
            <SunoBotLogo />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
