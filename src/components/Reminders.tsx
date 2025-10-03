'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, Bell, Loader2, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { getParsedReminder, getTranscription } from '@/app/actions';
import { format, parse } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const reminderSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  date: z.string().optional(),
  repeatDaily: z.boolean(),
}).refine(data => data.repeatDaily || data.date, {
  message: "Either select a date or check 'Repeat Daily'",
  path: ['date'],
});

type ReminderFormValues = z.infer<typeof reminderSchema>;
type Reminder = ReminderFormValues & { id: string };

export default function Reminders() {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const remindersColRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'reminders') : null, [user, firestore]);
  const { data: reminders, isLoading: areRemindersLoading } = useCollection<Reminder>(remindersColRef);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      medicineName: '',
      dosage: '',
      time: '',
      date: '',
      repeatDaily: false,
    },
  });

  const handleVoiceCommand = async (audioDataUri: string) => {
    setIsParsing(true);
    try {
        const { transcription } = await getTranscription({ audioDataUri });
        if (!transcription) {
          throw new Error('Could not transcribe audio.');
        }
        
        const result = await getParsedReminder({ query: transcription });
        form.setValue('medicineName', result.medicine);
        form.setValue('dosage', result.dosage || '');
        form.setValue('time', result.time);
        form.setValue('date', result.date || '');
        form.setValue('repeatDaily', result.isDaily);
        toast({ title: 'Reminder details filled', description: 'Check the form and save your reminder.' });
    } catch (error) {
        console.error('Failed to parse reminder:', error);
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not understand the reminder details.' });
    } finally {
        setIsParsing(false);
    }
  };

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleVoiceCommand);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast({ title: 'Notifications Enabled', description: 'You will now receive reminders.' });
      } else {
        toast({ variant: 'destructive', title: 'Notifications Denied', description: 'You will not receive reminders.' });
      }
    });
  };

  const onSubmit = (data: ReminderFormValues) => {
    if (!remindersColRef) return;
    addDocumentNonBlocking(remindersColRef, { ...data, createdAt: new Date().toISOString() });
    scheduleNotification({ ...data, id: '' }); // ID is not needed for scheduling
    form.reset();
    toast({ title: 'Reminder Set!', description: `${data.medicineName} reminder has been saved.` });
  };
  
  const scheduleNotification = (reminder: Reminder) => {
    if (notificationPermission !== 'granted') return;

    const [hours, minutes] = reminder.time.split(':').map(Number);
    const notificationTime = reminder.date 
        ? new Date(reminder.date) 
        : new Date();

    if (reminder.date) {
         const [year, month, day] = reminder.date.split('-').map(Number);
         notificationTime.setFullYear(year, month - 1, day);
    }
    
    notificationTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    let delay = notificationTime.getTime() - now.getTime();
    if(delay < 0) {
        if(reminder.repeatDaily) {
            delay += 24 * 60 * 60 * 1000;
        } else {
            return; // Don't schedule past events
        }
    }
    
    setTimeout(() => {
        new Notification(`Time for your medicine: ${reminder.medicineName}`, {
            body: `Dosage: ${reminder.dosage || 'Not specified'}.`,
            icon: '/logo.png'
        });
        if(reminder.repeatDaily) {
            scheduleNotification(reminder); // Reschedule for next day
        } else {
            if (remindersColRef) {
              const reminderDocRef = doc(remindersColRef, reminder.id);
              deleteDocumentNonBlocking(reminderDocRef);
            }
        }
    }, delay);
  };

  const deleteReminder = (id: string) => {
    if (!remindersColRef) return;
    const reminderDocRef = doc(remindersColRef, id);
    deleteDocumentNonBlocking(reminderDocRef);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold text-center">Medicine Reminders</h1>
      </header>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {notificationPermission !== 'granted' && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>Enable Notifications</AlertTitle>
            <AlertDescription>
              To get reminders, you need to allow notifications.
              <Button onClick={requestNotificationPermission} size="sm" className="ml-4">
                Allow Notifications
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="p-4 border rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add New Reminder</h2>
                <Button 
                    type="button" 
                    size="icon" 
                    variant={isRecording ? 'destructive' : 'outline'}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isParsing}
                >
                    {isParsing ? <Loader2 className="animate-spin"/> : <Mic />}
                </Button>
              </div>
              <FormField name="medicineName" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Medicine Name</FormLabel><FormControl><Input placeholder="e.g., Panadol" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="dosage" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Dosage</FormLabel><FormControl><Input placeholder="e.g., 2 tablets" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="time" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="date" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" disabled={form.watch('repeatDaily')} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="repeatDaily" control={form.control} render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>Repeat Daily</FormLabel></div>
                  </FormItem>
              )} />
              <Button type="submit" className="w-full">Save Reminder</Button>
            </form>
          </Form>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Active Reminders</h2>
            {areRemindersLoading && <Loader2 className="animate-spin" />}
            {!areRemindersLoading && reminders?.length === 0 && <p className="text-sm text-muted-foreground">No reminders set yet.</p>}
            {reminders?.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                        <p className="font-semibold">{r.medicineName}</p>
                        <p className="text-sm text-muted-foreground">
                            {r.dosage ? `${r.dosage} at ` : ''}
                            {format(parse(r.time, 'HH:mm', new Date()), 'h:mm a')}
                            {r.repeatDaily ? ' (Daily)' : ` on ${r.date && format(new Date(r.date+'T00:00:00'), 'MMM d, yyyy')}`}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)}>
                        <Trash2 className="text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

    