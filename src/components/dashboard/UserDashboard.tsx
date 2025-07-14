
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FilePen, FileText, PlusCircle } from 'lucide-react';
import EditFormSkeleton from '@/components/form/EditFormSkeleton';

const EditSubmissionForm = dynamic(() => import('@/components/form/EditSubmissionForm'), {
    loading: () => <EditFormSkeleton />,
});

export default function UserDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetchingSubmissions, setIsFetchingSubmissions] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    
    const router = useRouter();
    const { toast } = useToast();

    const fetchSubmissions = useCallback(async (uid: string) => {
        setIsFetchingSubmissions(true);
        try {
            const q = query(collection(db, "submissions"), where("userId", "==", uid));
            const querySnapshot = await getDocs(q);
            const userSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort submissions by creation date, newest first
            userSubmissions.sort((a, b) => {
                const dateA = a.createdAt?.toDate();
                const dateB = b.createdAt?.toDate();
                if (dateA && dateB) {
                    return dateB.getTime() - dateA.getTime();
                }
                return 0;
            });
            
            setSubmissions(userSubmissions);
        } catch (error) {
            console.error("Error fetching submissions: ", error);
            toast({ title: "Error", description: "Could not fetch your submissions.", variant: "destructive" });
        } finally {
            setIsFetchingSubmissions(false);
        }
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchSubmissions(currentUser.uid);
            } else {
                router.push('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, fetchSubmissions]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({
                title: 'Signed Out',
                description: 'You have been successfully signed out.',
            });
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                title: 'Sign Out Error',
                description: 'There was a problem signing out. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleEditClick = (submission: any) => {
        setSelectedSubmission(submission);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        setSelectedSubmission(null);
        if (user) {
            fetchSubmissions(user.uid);
        }
    };
    
    const handleViewSinglePdf = (submission: any) => {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(18);
        doc.text(`Submission Details`, 105, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(12);
        doc.text(`First Name: ${submission.firstName}`, 20, yPos);
        yPos += 10;
        doc.text(`Surname: ${submission.surname}`, 20, yPos);
        yPos += 10;
        doc.text(`Address: ${submission.address}`, 20, yPos);
        yPos += 10;
        doc.text(`Postcode: ${submission.postcode}`, 20, yPos);
        yPos += 10;
        doc.text(`Email: ${submission.email}`, 20, yPos);
        yPos += 10;
        doc.text(`Favorite Time of Day: ${submission.favoriteTimeOfDay}`, 20, yPos);
        yPos += 10;
        if (submission.createdAt?.toDate) {
            doc.text(`Submitted On: ${submission.createdAt.toDate().toLocaleString()}`, 20, yPos);
        }

        doc.output('dataurlnewwindow');
        
        toast({
            title: "Displaying PDF",
            description: "Your PDF is opening in a new tab.",
        });
    };

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin" />
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
            <Card className="w-full max-w-4xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-headline">Welcome!</CardTitle>
                        <CardDescription>You are logged in as {user.email}</CardDescription>
                    </div>
                     <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                </CardHeader>
                <CardContent>
                    <h2 className="text-xl font-semibold mb-4">Your Submissions</h2>
                    {isFetchingSubmissions ? (
                        <div className="flex justify-center items-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : submissions.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>First Name</TableHead>
                                        <TableHead>Surname</TableHead>
                                        <TableHead className="hidden sm:table-cell">Submitted On</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((submission) => (
                                        <TableRow key={submission.id}>
                                            <TableCell className="font-medium">{submission.firstName}</TableCell>
                                            <TableCell>{submission.surname}</TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {submission.createdAt?.toDate().toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewSinglePdf(submission)}>
                                                        <FileText className="mr-2 h-4 w-4" /> PDF
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(submission)}>
                                                        <FilePen className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p>You have not made any submissions yet.</p>
                    )}
                </CardContent>
                 <CardFooter className="border-t px-6 py-4 flex items-center gap-2">
                    <Button asChild>
                    <Link href="/new-submission">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Submission
                    </Link>
                    </Button>
                </CardFooter>
            </Card>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit Submission</DialogTitle>
                        <DialogDescription>
                            Make changes to your submitted data here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSubmission && (
                        <EditSubmissionForm
                            submission={selectedSubmission}
                            onSuccess={handleEditSuccess}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}
