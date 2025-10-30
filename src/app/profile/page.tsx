'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { SunoBotLogo } from '@/components/icons';
import { Loader2, User as UserIcon, Mail, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { doc } from 'firebase/firestore';


type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred while logging out.' });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.isAnonymous) {
      return (
          <div className="flex flex-col h-full bg-background p-4">
              <header className="p-4 border-b text-center">
                  <h1 className="text-xl font-bold">Profile</h1>
              </header>
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                    <AvatarFallback>
                        <UserIcon size={48} />
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">Guest User</h2>
                <p className="text-muted-foreground mt-2">Sign up to create a profile and save your data.</p>
                <Button onClick={handleLogout} className="mt-6">
                    <LogOut className="mr-2" /> Sign Up / Log In
                </Button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-background">
        <header className="p-4 border-b">
            <h1 className="text-xl font-bold text-center">Profile</h1>
        </header>
        <div className="flex-grow p-4 overflow-y-auto space-y-6">
             <Card>
                <CardHeader className="items-center text-center">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarFallback className="text-3xl">
                            {userProfile?.firstName?.[0]}
                            {userProfile?.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">{userProfile?.firstName} {userProfile?.lastName}</CardTitle>
                    <CardDescription>Welcome to SunoBot!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <Mail className="w-5 h-5 text-muted-foreground"/>
                        <div className="text-sm">
                            <p className="font-medium">Email</p>
                            <p className="text-muted-foreground">{userProfile?.email}</p>
                        </div>
                   </div>
                   <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-muted-foreground"/>
                        <div className="text-sm">
                            <p className="font-medium">Member Since</p>
                            <p className="text-muted-foreground">
                                {userProfile?.createdAt ? format(new Date(userProfile.createdAt), 'MMMM d, yyyy') : 'N/A'}
                            </p>
                        </div>
                   </div>
                   <Button onClick={handleLogout} variant="outline" className="w-full">
                       <LogOut className="mr-2" /> Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
