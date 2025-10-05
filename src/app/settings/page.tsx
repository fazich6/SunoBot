'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Moon, Mic, Bell, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SunoBotLogo } from '@/components/icons';


const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['English', 'Urdu']),
  voicePreference: z.enum(['Male', 'Female']),
  enableTopicSuggestions: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SectionCard = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <div className='flex items-start gap-4'>
                <Icon className="w-6 h-6 text-primary mt-1"/>
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const settingsDocRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<SettingsFormValues>(settingsDocRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { 
        theme: 'light', 
        language: 'English', 
        voicePreference: 'Male',
        enableTopicSuggestions: true
    },
  });

  useEffect(() => {
    if (settingsData) {
      form.reset(settingsData);
    }
  }, [settingsData, form]);
  
  useEffect(() => {
    if (!settingsDocRef) return;
    const subscription = form.watch((value) => {
        if (!value) return;
        
        // Filter out undefined values before saving
        const cleanedValue = Object.fromEntries(
            Object.entries(value).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(cleanedValue).length > 0) {
            setDocumentNonBlocking(settingsDocRef, cleanedValue, { merge: true });
        }
    });
    return () => subscription.unsubscribe();
  }, [form, settingsDocRef]);
  
  const handleClearHistory = async () => {
    if (!user || !firestore) return;

    const chatHistoryColRef = collection(firestore, 'users', user.uid, 'chatHistory');

    try {
      const querySnapshot = await getDocs(chatHistoryColRef);
      if (querySnapshot.empty) {
        toast({
          title: "No History Found",
          description: "Your chat history is already empty.",
        });
        return;
      }

      const batch = writeBatch(firestore);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      toast({
        title: "Chat History Cleared",
        description: "Your conversation history has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not clear chat history. Please try again.",
      });
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
            <SunoBotLogo />
        </div>
      </header>

      {isLoading ? (
         <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
         </div>
      ) : (
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        <Form {...form}>
          <form className="space-y-6">
            <SectionCard 
                icon={Moon} 
                title="Appearance" 
                description="Customize the look and feel of the app."
            >
                <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                        <FormItem className='flex justify-between items-center'>
                            <FormLabel>Theme</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </SectionCard>

            <SectionCard 
                icon={Mic} 
                title="Voice & Language" 
                description="Set your preferred language and voice for interactions."
            >
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                             <FormItem className='flex justify-between items-center'>
                                <FormLabel>App Language</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Urdu">Urdu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="voicePreference"
                        render={({ field }) => (
                             <FormItem className='flex justify-between items-center'>
                                <FormLabel>Voice Preference</FormLabel>
                                <FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Select voice" />
                                        </Trigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </SectionCard>

            <SectionCard 
                icon={Bell} 
                title="Notifications" 
                description="Manage how you receive notifications."
            >
                <FormField
                    control={form.control}
                    name="enableTopicSuggestions"
                    render={({ field }) => (
                         <FormItem className='flex justify-between items-center'>
                            <FormLabel>Enable Topic Suggestions</FormLabel>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </SectionCard>

            <SectionCard 
                icon={Trash2} 
                title="Data Management" 
                description="Manage your application data."
            >
                <div className='flex justify-between items-center'>
                    <div>
                        <FormLabel>Clear Chat History</FormLabel>
                        <p className="text-sm text-muted-foreground">This will permanently delete your conversation history.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Clear</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your chat history.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </SectionCard>

          </form>
        </Form>
      </div>
      )}
    </div>
  );
}
