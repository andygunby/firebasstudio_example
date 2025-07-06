'use client';

import dynamic from 'next/dynamic';
import AdminDashboardSkeleton from '@/components/admin/AdminDashboardSkeleton';

const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard'), {
  loading: () => <AdminDashboardSkeleton />,
  ssr: false,
});

export default function AdminDashboardLoader() {
  return <AdminDashboard />;
}
