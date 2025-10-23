'use client';

import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Moon, Mic, Bell, Trash2, Sun, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['English', 'Urdu']),
  voicePreference: z.enum(['Male', 'Female']),
  enableTopicSuggestions: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SectionCard = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Icon className="w-6 h-6 text-primary" />
        <div className="flex-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

export default function SettingsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsDocRef = useMemoFirebase(() => (user ? doc(firestore, 'settings', user.uid) : null), [user, firestore]);
  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<SettingsFormValues>(settingsDocRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      theme: 'system',
      language: 'English',
      voicePreference: 'Male',
      enableTopicSuggestions: true,
    },
  });
  
  useEffect(() => {
    if (settingsData) {
      form.reset(settingsData);
    }
  }, [settingsData, form]);

  const onSubmit = useCallback((data: SettingsFormValues) => {
    if (!settingsDocRef) return;
    setDocumentNonBlocking(settingsDocRef, data, { merge: true });
    toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
  }, [settingsDocRef, toast]);
  
  // This effect listens for changes in the form and saves them automatically
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') {
        onSubmit(value as SettingsFormValues);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  const handleClearHistory = async () => {
    if (!user || !firestore) return;
    const chatHistoryColRef = collection(firestore, 'users', user.uid, 'chatHistory');
    try {
      const querySnapshot = await getDocs(chatHistoryColRef);
      if (querySnapshot.empty) {
        toast({ title: 'Chat History', description: 'Your history is already empty.' });
        return;
      }
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast({ title: 'Success!', description: 'Your chat history has been cleared.' });
    } catch (error) {
      console.error("Error clearing chat history: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not clear chat history.' });
    }
  };

  const isLoading = isUserLoading || isSettingsLoading;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto space-y-6">
          <Form {...form}>
            <form className="space-y-6">
              <SectionCard icon={Moon} title="Appearance" description="Customize your app's look and feel.">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
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
              </SectionCard>

              <SectionCard icon={Mic} title="Language & Voice" description="Choose your preferred language and voice.">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger></FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select voice" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </SectionCard>

              <SectionCard icon={Bell} title="Personalization" description="Control suggestions and notifications.">
                <FormField
                  control={form.control}
                  name="enableTopicSuggestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Topic Suggestions</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </SectionCard>
              
               <SectionCard icon={Trash2} title="Data Management" description="Manage your personal data.">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">Clear Chat History</Button>
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
                            <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
               </SectionCard>

            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
