'use client';

import dynamic from 'next/dynamic';
import UserSubmissionsSkeleton from '@/components/admin/UserSubmissionsSkeleton';

const UserSubmissions = dynamic(() => import('@/components/admin/UserSubmissions'), {
  loading: () => <UserSubmissionsSkeleton />,
  ssr: false,
});

export default function UserSubmissionsLoader({ userId }: { userId: string }) {
  return <UserSubmissions userId={userId} />;
}
