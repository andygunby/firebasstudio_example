"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { extractDetails } from "@/ai/flows/extract-details-flow";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, UploadCloud, Info, LogIn } from "lucide-react";
import CreatePasswordForm from "@/components/auth/CreatePasswordForm";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  surname: z.string().min(1, { message: "Surname is required." }),
  address: z.string().min(1, { message: "Address is required." }),
  postcode: z.string().min(1, { message: "Postcode is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  favoriteTimeOfDay: z.string({ required_error: "Please select a time of day." }),
  createLogin: z.boolean().default(false).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FormEaseForm() {
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [step, setStep] = useState<"form" | "createPassword" | "success">("form");
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      address: "",
      postcode: "",
      email: "",
      favoriteTimeOfDay: undefined,
      createLogin: false,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Error',
        description: 'Could not sign you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        toast({
            title: "Invalid File Type",
            description: "Please upload a PDF or TXT file.",
            variant: "destructive",
        });
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
            title: "File Too Large",
            description: "Please upload a file smaller than 5MB.",
            variant: "destructive",
        });
        return;
    }

    setIsExtracting(true);
    toast({
        title: "Extracting Details...",
        description: "Please wait while we analyze your document.",
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const fileDataUri = reader.result as string;
            const extractedData = await extractDetails({ fileDataUri });

            if (!extractedData || Object.keys(extractedData).length === 0) {
                 toast({
                    title: "Extraction Failed",
                    description: "We couldn't find details in the document. Please fill the form manually.",
                    variant: "destructive",
                });
                return;
            }

            let fieldsSet = 0;
            if (extractedData.firstName) { form.setValue('firstName', extractedData.firstName); fieldsSet++; }
            if (extractedData.surname) { form.setValue('surname', extractedData.surname); fieldsSet++; }
            if (extractedData.address) { form.setValue('address', extractedData.address); fieldsSet++; }
            if (extractedData.postcode) { form.setValue('postcode', extractedData.postcode); fieldsSet++; }
            if (extractedData.email) { form.setValue('email', extractedData.email); fieldsSet++; }
            if (extractedData.favoriteTimeOfDay) { form.setValue('favoriteTimeOfDay', extractedData.favoriteTimeOfDay); fieldsSet++; }

            toast({
                title: "Details Extracted!",
                description: `${fieldsSet} field(s) have been pre-filled for you.`,
            });

        } catch (error) {
            console.error("Error extracting details: ", error);
            toast({
                title: "Extraction Error",
                description: "An error occurred during extraction. This may be due to a missing or invalid Gemini API key.",
                variant: "destructive",
            });
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.onerror = () => {
        toast({
            title: "File Read Error",
            description: "Could not read the selected file.",
            variant: "destructive",
        });
        setIsExtracting(false);
    };
  };

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    
    try {
      if (values.createLogin && !currentUser) {
        setSubmittedData(values);
        setStep('createPassword');
      } else {
        const { createLogin, ...submissionData } = values;
        const dataToSave = {
            ...submissionData,
            createdAt: new Date(),
            ...(currentUser && { userId: currentUser.uid })
        };
        await addDoc(collection(db, "submissions"), dataToSave);
        setSubmittedData(values);
        setStep('success');
      }
    } catch (error) {
      console.error("Error writing document: ", error);
      toast({
        title: "Submission Error",
        description: "There was a problem saving your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleReset = () => {
    setSubmittedData(null);
    setStep('form');
    form.reset();
  };

  if (step === 'createPassword' && submittedData) {
    return <CreatePasswordForm email={submittedData.email} formData={submittedData} onPasswordSet={() => setStep('success')} />;
  }

  if (step === 'success' && submittedData) {
    const accountCreated = submittedData.createLogin;
    
    return (
        <div className="w-full max-w-lg text-center bg-card p-8 rounded-xl border">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold">
              {accountCreated ? "Account Created Successfully!" : "Submission Successful!"}
            </h1>
            <p className="text-muted-foreground">
              {accountCreated ? "You can now log in to view and manage your submissions." : "Thank you for submitting your details."}
            </p>
            <div className="space-y-4 pt-6">
                <h3 className="font-semibold text-lg text-center border-b pb-2 mb-4">Submitted Information</h3>
                <div className="text-sm text-left text-muted-foreground space-y-2 rounded-lg bg-muted/50 p-4 border">
                    <p><strong className="font-medium text-foreground">First Name:</strong> {submittedData.firstName}</p>
                    <p><strong className="font-medium text-foreground">Surname:</strong> {submittedData.surname}</p>
                    <p><strong className="font-medium text-foreground">Address:</strong> {submittedData.address}</p>
                    <p><strong className="font-medium text-foreground">Postcode:</strong> {submittedData.postcode}</p>
                    <p><strong className="font-medium text-foreground">Email:</strong> {submittedData.email}</p>
                    <p><strong className="font-medium text-foreground">Favorite Time of Day:</strong> {submittedData.favoriteTimeOfDay}</p>
                </div>
            </div>
            {accountCreated ? (
              <Button asChild className="mt-8">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login with New Credentials
                </Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReset} className="mt-8">Submit Another Form</Button>
            )}
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-card p-8 rounded-xl border">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">New Submission</h1>
            <p className="text-muted-foreground mt-2">
                Please fill out the form below. All fields are required.
            </p>
        </div>
        <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                 <div className="space-y-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full"
                        disabled={isExtracting}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isExtracting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                        ) : (
                            <><UploadCloud className="mr-2 h-4 w-4" /> Autofill from Document (PDF/TXT)</>
                        )}
                    </Button>
                     <FormControl>
                        <Input 
                            id="file-upload" 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.txt"
                            onChange={handleFileChange}
                            disabled={isExtracting}
                            ref={fileInputRef}
                        />
                    </FormControl>
                </div>

                {currentUser && (
                  <div className="rounded-md border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950 p-3 text-sm text-sky-800 dark:text-sky-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 shrink-0" />
                        <div>
                         You are logged in as <span className="font-semibold">{currentUser.email}</span>.
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-sky-100 dark:bg-sky-800 hover:bg-sky-200 dark:hover:bg-sky-700 text-sky-800 dark:text-sky-100 border-sky-200 dark:border-sky-700">
                        Sign Out
                    </Button>
                  </div>
                )}

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Or fill manually
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="favoriteTimeOfDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favourite Time of Day</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time of day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {currentUser === null && (
                  <FormField
                    control={form.control}
                    name="createLogin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Create a login account?
                          </FormLabel>
                          <FormDescription>
                            You can use your email address to log in later.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isExtracting || currentUser === undefined}>
                  {(isSubmitting || isExtracting || currentUser === undefined) && <Loader2 className="animate-spin" />}
                  {isSubmitting ? 'Submitting...' : isExtracting ? 'Analyzing...' : (currentUser === undefined ? 'Initializing...' : 'Submit')}
                </Button>
              </form>
            </Form>
        </div>
    </div>
  );
}
