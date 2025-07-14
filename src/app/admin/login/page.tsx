import dynamic from 'next/dynamic';
import LoginSkeleton from '@/components/auth/LoginSkeleton';

const AdminLoginForm = dynamic(() => import('@/components/auth/AdminLoginForm'), {
  loading: () => <LoginSkeleton />,
});

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <AdminLoginForm />
    </main>
  );
}
