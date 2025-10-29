'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Camera, Bell, User, ClipboardList } from 'lucide-react';
import React from 'react';

const NavItem = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className="flex-1">
      <Button
        variant="ghost"
        className={`flex flex-col items-center h-full rounded-none justify-center gap-1 text-xs w-full ${
          isActive
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Button>
    </Link>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show the nav bar on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-background flex flex-col overflow-hidden relative font-body">
      <main className="flex-grow overflow-hidden">{children}</main>
      <nav className="flex justify-around border-t">
        <NavItem
          href="/chat"
          icon={MessageSquare}
          label="Chat"
        />
        <NavItem
          href="/analyze"
          icon={Camera}
          label="Analyze"
        />
        <NavItem
          href="/reports"
          icon={ClipboardList}
          label="Reports"
        />
        <NavItem
          href="/reminders"
          icon={Bell}
          label="Reminders"
        />
        <NavItem
            href="/profile"
            icon={User}
            label="Profile"
        />
      </nav>
    </div>
  );
}
