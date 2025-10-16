import { Suspense } from 'react';
import { FeeManagement } from '@/components/fees/FeeManagement';
import { Auth } from '@/components/home/auth';

function FeeManagementWrapper() {
  return <FeeManagement />;
}

export default function FeePage() {
  return (
    <Auth>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <FeeManagementWrapper />
      </Suspense>
    </Auth>
  );
}
