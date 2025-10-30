'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Moon, Mic, Bell, Trash2, Loader2, User, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';


const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['English', 'Urdu']),
  voicePreference: z.enum(['Male', 'Female']),
  enableTopicSuggestions: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  // Firestore references
  const settingsRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const chatHistoryColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'chatHistory') : null, [user, firestore]);

  // Data hooks
  const { data: settings, isLoading: isSettingsLoading } = useDoc<SettingsFormValues>(settingsRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: chatHistory } = useCollection(chatHistoryColRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  // Effect to populate form with loaded settings
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    } else if (user && !isSettingsLoading) {
      // If no settings exist, create a default set
      const defaultSettings: SettingsFormValues = {
        theme: 'system',
        language: 'English',
        voicePreference: 'Male',
        enableTopicSuggestions: true,
      };
      setDocumentNonBlocking(settingsRef!, defaultSettings, { merge: false });
      form.reset(defaultSettings);
    }
  }, [settings, isSettingsLoading, form, user, settingsRef]);
  
  // Effect to save changes automatically
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && settingsRef && settings) {
        setDocumentNonBlocking(settingsRef, { [name]: value[name] }, { merge: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, settingsRef, settings]);


  const handleClearHistory = async () => {
    if (!chatHistoryColRef || !chatHistory) return;
    setIsClearing(true);
    try {
      // A batch can handle up to 500 operations.
      // For larger histories, you'd need to chunk the deletions.
      const batch = writeBatch(firestore);
      chatHistory.forEach(msg => {
        const docRef = doc(chatHistoryColRef, msg.id);
        batch.delete(docRef);
      });
      await batch.commit();
      toast({ title: 'Success', description: 'Your chat history has been cleared.' });
    } catch (error) {
      console.error("Failed to clear chat history:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not clear chat history.' });
    } finally {
      setIsClearing(false);
    }
  };
  
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

  const isLoading = isSettingsLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Settings</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        <Form {...form}>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <CardTitle>My Profile</CardTitle>
                        <CardDescription>
                          {user?.isAnonymous ? 'Anonymous Guest' : userProfile?.email || 'Loading...'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleLogout} className="w-full">
                       <LogOut className="mr-2" /> Log Out
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of the app.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Mic className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle>Language & Voice</CardTitle>
                  <CardDescription>Choose your preferred language and voice.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a language" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Urdu">Urdu</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="voicePreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a voice" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
             <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <CardTitle>Personalization</CardTitle>
                        <CardDescription>Manage how the app works for you.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="enableTopicSuggestions"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Topic Suggestions</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Trash2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your personal data.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Clear Chat History
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your entire chat history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory} disabled={isClearing}>
                        {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
        </Form>
      </div>
    </div>
  );
}
