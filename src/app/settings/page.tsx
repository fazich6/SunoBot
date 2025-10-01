'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';

const settingsSchema = z.object({
  language: z.enum(['English', 'Urdu']),
  theme: z.enum(['light', 'dark', 'system']),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const settingsDocRef = useMemoFirebase(() => user ? doc(firestore, 'settings', user.uid) : null, [user, firestore]);
  const { data: settingsData, isLoading: isSettingsLoading } = useDoc<SettingsFormValues>(settingsDocRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { language: 'English', theme: 'system' },
  });

  useEffect(() => {
    if (settingsData) {
      form.reset(settingsData);
    }
  }, [settingsData, form]);
  
  useEffect(() => {
    const subscription = form.watch((value) => {
        if (!settingsDocRef || !value) return;
        setDocumentNonBlocking(settingsDocRef, value, { merge: true });
    });
    return () => subscription.unsubscribe();
  }, [form, settingsDocRef]);


  const isLoading = isUserLoading || isSettingsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold text-center flex-grow">Settings</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="English" />
                        </FormControl>
                        <FormLabel className="font-normal">English</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Urdu" />
                        </FormControl>
                        <FormLabel className="font-normal">Urdu</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="light" />
                        </FormControl>
                        <FormLabel className="font-normal">Light</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="dark" />
                        </FormControl>
                        <FormLabel className="font-normal">Dark</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="system" />
                        </FormControl>
                        <FormLabel className="font-normal">System</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
