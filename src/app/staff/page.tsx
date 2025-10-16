import { Auth } from '@/components/home/auth';
import StaffRouter from '@/components/staff/StaffRouter';

export default function StaffPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <StaffRouter />
      </div>
    </Auth>
  );
}