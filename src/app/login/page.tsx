'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SunoBotLogo } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const registerSchema = z.object({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});


export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Success', description: 'Logged in successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userProfileData = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            createdAt: new Date().toISOString(),
        };
        setDocumentNonBlocking(userDocRef, userProfileData, { merge: false });
      }
      
      toast({ title: 'Success', description: 'Account created successfully.' });
      setIsLoginView(true); // Switch to login view on success
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: 'Success', description: 'Logged in anonymously.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Anonymous Login Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4"><SunoBotLogo /></div>
          <CardTitle>{isLoginView ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoginView ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                    name="email"
                    control={loginForm.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} 
                />
                <FormField
                    name="password"
                    control={loginForm.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField 
                    name="firstName" 
                    control={registerForm.control} 
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} 
                  />
                  <FormField 
                    name="lastName" 
                    control={registerForm.control} 
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} 
                  />
                </div>
                <FormField 
                    name="email" 
                    control={registerForm.control} 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} 
                />
                <FormField 
                    name="password" 
                    control={registerForm.control} 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} 
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </form>
            </Form>
          )}
           <div className="mt-4 text-center text-sm">
            {isLoginView ? "Don't have an account? " : 'Already have an account? '}
            <Button variant="link" onClick={() => setIsLoginView(!isLoginView)} className="p-0 h-auto">
              {isLoginView ? 'Sign up' : 'Log in'}
            </Button>
          </div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleAnonymousLogin} disabled={isLoading}>
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
