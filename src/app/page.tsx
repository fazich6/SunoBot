'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page's sole purpose is to redirect to the main chat interface.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  // Return a null or a loading indicator while redirecting.
  return null;
}
