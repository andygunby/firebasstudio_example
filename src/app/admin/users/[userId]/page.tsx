import UserSubmissionsLoader from '@/components/admin/UserSubmissionsLoader';

export default function UserSubmissionsPage({ params }: { params: { userId: string } }) {
  return <UserSubmissionsLoader userId={params.userId} />;
}
