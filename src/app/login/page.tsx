import dynamic from 'next/dynamic';
import LoginSkeleton from '@/components/auth/LoginSkeleton';

const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), {
  loading: () => <LoginSkeleton />,
});

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <LoginForm />
    </main>
  );
}
