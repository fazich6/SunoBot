'use client';

import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
