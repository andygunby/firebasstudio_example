'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, FilePen, Search } from 'lucide-react';
import EditFormSkeleton from '@/components/form/EditFormSkeleton';

const EditSubmissionForm = dynamic(() => import('@/components/form/EditSubmissionForm'), {
    loading: () => <EditFormSkeleton />,
});

export default function AdminDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFetchingSubmissions, setIsFetchingSubmissions] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    
    const router = useRouter();
    const { toast } = useToast();

    const fetchAllSubmissions = useCallback(async () => {
        setIsFetchingSubmissions(true);
        try {
            const q = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const allSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(allSubmissions);
        } catch (error) {
            console.error("Error fetching submissions: ", error);
            toast({ title: "Error", description: "Could not fetch submissions.", variant: "destructive" });
        } finally {
            setIsFetchingSubmissions(false);
        }
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setUser(currentUser);
                    fetchAllSubmissions();
                } else {
                    await signOut(auth);
                    router.push('/admin/login');
                }
            } else {
                router.push('/admin/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, fetchAllSubmissions]);
    
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = submissions.filter(submission =>
            (submission.email?.toLowerCase() || '').includes(lowercasedFilter) ||
            (submission.firstName?.toLowerCase() || '').includes(lowercasedFilter) ||
            (submission.surname?.toLowerCase() || '').includes(lowercasedFilter)
        );
        setFilteredSubmissions(filteredData);
    }, [searchTerm, submissions]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/admin/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleEditClick = (submission: any) => {
        setSelectedSubmission(submission);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        setSelectedSubmission(null);
        fetchAllSubmissions();
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
            <Card className="w-full max-w-6xl shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl font-headline">Admin Dashboard</CardTitle>
                        <CardDescription>Viewing all submissions as {user.email}</CardDescription>
                    </div>
                     <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by email, first name, or surname..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full pl-10"
                            />
                        </div>
                    </div>
                    {isFetchingSubmissions ? (
                        <div className="flex justify-center items-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>First Name</TableHead>
                                        <TableHead>Surname</TableHead>
                                        <TableHead className="hidden md:table-cell">Submitted On</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSubmissions.length > 0 ? (
                                        filteredSubmissions.map((submission) => (
                                            <TableRow key={submission.id}>
                                                <TableCell className="font-medium">{submission.email}</TableCell>
                                                <TableCell>{submission.firstName}</TableCell>
                                                <TableCell>{submission.surname}</TableCell>
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
                                                {submissions.length === 0 ? "There are no submissions in the database yet." : "No results found."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
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
