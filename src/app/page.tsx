'use client';

import { useState } from 'react';
import SunoBot from '@/components/SunoBot';
import Analyze from '@/components/Analyze';
import Homework from '@/components/Homework';
import Reminders from '@/components/Reminders';
import Profile from '@/app/profile/page';
import Reports from '@/app/reports/page';
import { Button } from '@/components/ui/button';
import { MessageSquare, Camera, BookOpen, Bell, User, ClipboardText } from 'lucide-react';
import { useUser } from '@/firebase';

type ActiveView = 'chat' | 'analyze' | 'homework' | 'reminders' | 'profile' | 'reports';

const NavItem = ({
  view,
  activeView,
  setView,
  icon: Icon,
  label,
}: {
  view: ActiveView;
  activeView: ActiveView;
  setView: (view: ActiveView) => void;
  icon: React.ElementType;
  label: string;
}) => (
  <Button
    variant="ghost"
    className={`flex flex-col items-center h-full rounded-none justify-center gap-1 text-xs w-full ${
      activeView === view
        ? 'text-primary bg-primary/10'
        : 'text-muted-foreground'
    }`}
    onClick={() => setView(view)}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Button>
);

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const { user } = useUser();

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <SunoBot />;
      case 'analyze':
        return <Analyze />;
      case 'homework':
        return <Homework />;
      case 'reminders':
        return <Reminders />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      default:
        return <SunoBot />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-background flex flex-col overflow-hidden relative font-body">
      <div className="flex-grow overflow-hidden">{renderView()}</div>
      <nav className="flex justify-around border-t">
        <NavItem
          view="chat"
          activeView={activeView}
          setView={setActiveView}
          icon={MessageSquare}
          label="Chat"
        />
        <NavItem
          view="analyze"
          activeView={activeView}
          setView={setActiveView}
          icon={Camera}
          label="Analyze"
        />
        <NavItem
          view="reports"
          activeView={activeView}
          setView={setActiveView}
          icon={ClipboardText}
          label="Reports"
        />
        <NavItem
          view="reminders"
          activeView={activeView}
          setView={setActiveView}
          icon={Bell}
          label="Reminders"
        />
        {!user?.isAnonymous && (
            <NavItem
            view="profile"
            activeView={activeView}
            setView={setActiveView}
            icon={User}
            label="Profile"
            />
        )}
      </nav>
    </div>
  );
}
