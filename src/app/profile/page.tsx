'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, Settings } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = getAuth();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: profileData, isLoading: isProfileLoading } = useDoc<ProfileFormValues>(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  useEffect(() => {
    if (profileData) {
      form.reset(profileData);
    } else if (user) {
        form.reset({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            email: user.email || '',
        })
    }
  }, [profileData, user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!userDocRef) return;
    
    // Create a date string only if it's a new profile
    const createdAt = profileData?.createdAt || new Date().toISOString();

    setDocumentNonBlocking(userDocRef, { ...data, createdAt }, { merge: true });
    toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });
  };
  
  const handleLogout = async () => {
    await auth.signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (user && user.isAnonymous) {
      return (
        <div className="flex flex-col h-full bg-background p-4 items-center justify-center text-center">
             <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg text-center">
                <p className="text-sm text-yellow-800 mb-4">You are currently logged in as a guest. Sign up to save your data and access your profile.</p>
                <Button onClick={handleLogout}>Log Out & Sign Up</Button>
             </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold text-center">Profile</h1>
        <div>
            <Link href="/settings">
                <Button variant="ghost" size="icon">
                    <Settings />
                </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut />
            </Button>
        </div>
      </header>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        <div className="p-4 border rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField name="firstName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="lastName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} disabled /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
