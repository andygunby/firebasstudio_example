
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, LogIn, UserCog, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="w-full bg-secondary py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-foreground font-headline">
            Welcome to FormEase
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Your simple and elegant solution for creating, managing, and tracking submissions with ease. Get started in seconds.
          </p>
          <Button asChild size="lg">
            <Link href="/new-submission">
              Create a New Submission <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Actions Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* New Submission Card */}
            <div className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-lg transition-shadow bg-card">
              <FileText className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Start Fresh</h3>
              <p className="text-muted-foreground mb-4">
                Fill out and submit a new form quickly and efficiently.
              </p>
              <Button asChild variant="outline">
                <Link href="/new-submission">
                  New Submission
                </Link>
              </Button>
            </div>
            
            {/* User Login Card */}
            <div className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-lg transition-shadow bg-card">
              <LogIn className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Access Your Account</h3>
              <p className="text-muted-foreground mb-4">
                Log in to view and manage your past submissions.
              </p>
              <Button asChild variant="outline">
                <Link href="/login">
                  User Login
                </Link>
              </Button>
            </div>
            
            {/* Admin Login Card */}
            <div className="flex flex-col items-center text-center p-6 border rounded-lg hover:shadow-lg transition-shadow bg-card sm:col-span-2 lg:col-span-1">
               <UserCog className="h-12 w-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Admin Dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Access the dashboard to oversee all user submissions.
              </p>
              <Button asChild variant="outline">
                <Link href="/admin/login">
                 Admin Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-6 mt-auto border-t">
        <div className="container mx-auto px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FormEase. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}
