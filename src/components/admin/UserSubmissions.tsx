
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, orderBy, doc, getDoc, where } from 'firebase/firestore';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FilePen, ArrowLeft } from 'lucide-react';
import EditFormSkeleton from '@/components/form/EditFormSkeleton';

const EditSubmissionForm = dynamic(() => import('@/components/form/EditSubmissionForm'), {
    loading: () => <EditFormSkeleton />,
});

interface UserSubmissionsProps {
    userId: string;
}

export default function UserSubmissions({ userId }: UserSubmissionsProps) {
    const [user, setUser] = useState<any | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    
    const { toast } = useToast();

    const fetchUserDataAndSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch user data
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUser({ id: userDocSnap.id, ...userDocSnap.data() });
            } else {
                 throw new Error("User not found");
            }

            // Fetch submissions for this user
            const submissionsRef = collection(db, "submissions");
            const q = query(submissionsRef, where("userId", "==", userId));
            
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
            console.error("Error fetching data: ", error);
            toast({ title: "Error", description: "Could not fetch user data or submissions.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [userId, toast]);

    useEffect(() => {
        fetchUserDataAndSubmissions();
    }, [fetchUserDataAndSubmissions]);

    const handleEditClick = (submission: any) => {
        setSelectedSubmission(submission);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        setSelectedSubmission(null);
        fetchUserDataAndSubmissions();
    };

    if (loading) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin" />
            </main>
        );
    }
    
    return (
        <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
             <div className="w-full max-w-6xl mb-4">
                <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All Users
                    </Link>
                </Button>
            </div>
            <Card className="w-full max-w-6xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Submissions for {user?.email || 'User'}</CardTitle>
                    <CardDescription>Viewing all submissions associated with this account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Surname</TableHead>
                                    <TableHead className="hidden md:table-cell">Address</TableHead>
                                    <TableHead className="hidden md:table-cell">Submitted On</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submissions.length > 0 ? (
                                    submissions.map((submission) => (
                                        <TableRow key={submission.id}>
                                            <TableCell className="font-medium">{submission.firstName}</TableCell>
                                            <TableCell>{submission.surname}</TableCell>
                                            <TableCell className="hidden md:table-cell">{submission.address}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {submission.createdAt?.toDate().toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(submission)}>
                                                    <FilePen className="mr-2 h-4 w-4" /> Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            This user has no submissions.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit Submission</DialogTitle>
                        <DialogDescription>
                            Make changes to this user's submitted data. Click save when you're done.
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
