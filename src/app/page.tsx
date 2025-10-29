'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

// This is the main entry point. 
// It will redirect authenticated users to the chat page.
export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/chat');
    }
  }, [isUserLoading, user, router]);

  // You can show a loader here while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <p>Loading...</p>
    </div>
  );
}
