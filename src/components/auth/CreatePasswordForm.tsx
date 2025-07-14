
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof formSchema>;

interface CreatePasswordFormProps {
  email: string;
  formData: any;
  onPasswordSet: () => void;
}

export default function CreatePasswordForm({ email, formData, onPasswordSet }: CreatePasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: PasswordFormData) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      const userId = userCredential.user.uid;

      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        email: email,
        isAdmin: false,
      });

      const { createLogin, ...submissionData } = formData;
      const dataToSave = {
        ...submissionData,
        userId: userId,
        createdAt: new Date(),
      };
      await addDoc(collection(db, "submissions"), dataToSave);
      
      toast({
        title: "Account Created",
        description: "Your login has been successfully created.",
      });
      onPasswordSet();
    } catch (error: any) {
      console.error("Error creating user: ", error);
      let errorMessage = "There was a problem creating your account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use. Please use a different email or log in.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create Your Login</h1>
            <p className="text-muted-foreground mt-2">
                Set a password for your account. Your username is: <span className="font-medium text-foreground">{email}</span>
            </p>
        </div>
        <div className="bg-card p-8 rounded-xl border">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                        <Input placeholder="••••••••" type="password" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? 'Creating Account...' : 'Create Account & Finish'}
                </Button>
            </form>
            </Form>
        </div>
    </div>
  );
}
