
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFetchingUsers, setIsFetchingUsers] = useState(true);
    
    const router = useRouter();
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setIsFetchingUsers(true);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("email"));
            const querySnapshot = await getDocs(q);
            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users: ", error);
            toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
        } finally {
            setIsFetchingUsers(false);
        }
    }, [toast]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists() && userDocSnap.data().isAdmin) {
                    setUser(currentUser);
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
    }, [router]);
    
    useEffect(() => {
        if(user) {
            fetchUsers();
        }
    }, [user, fetchUsers]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = users.filter(u =>
            (u.email?.toLowerCase() || '').includes(lowercasedFilter)
        );
        setFilteredUsers(filteredData);
    }, [searchTerm, users]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({
                title: "Signed Out",
                description: "You have been successfully signed out.",
            });
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
            toast({
                title: "Sign Out Error",
                description: "There was a problem signing out. Please try again.",
                variant: "destructive",
            });
        }
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
                        <CardTitle className="text-3xl font-headline">Registered Users</CardTitle>
                        <CardDescription>Viewing all registered users as {user.email}</CardDescription>
                    </div>
                     <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter users by email..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full pl-10"
                            />
                        </div>
                    </div>
                    {isFetchingUsers ? (
                        <div className="flex justify-center items-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.email}</TableCell>
                                                <TableCell>
                                                    {u.isAdmin ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/users/${u.id}`}>
                                                            View Submissions <ChevronRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No registered users found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
