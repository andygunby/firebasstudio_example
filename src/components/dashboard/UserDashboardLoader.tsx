'use client';

import dynamic from 'next/dynamic';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

const UserDashboard = dynamic(() => import('@/components/dashboard/UserDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

export default function UserDashboardLoader() {
  return <UserDashboard />;
}
