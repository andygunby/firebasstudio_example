import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSkeleton from '@/components/form/FormSkeleton';

const FormEaseForm = dynamic(() => import('@/components/form/FormEaseForm'), {
  loading: () => <FormSkeleton />,
});

export default function NewSubmissionPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
       <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="ghost">
          <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Home
          </Link>
        </Button>
      </div>
      <FormEaseForm />
    </main>
  );
}
