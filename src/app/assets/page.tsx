import { Auth } from '@/components/home/auth';
import AssetManagement from '@/components/assets/AssetManagement';

export default function AssetsPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AssetManagement />
      </div>
    </Auth>
  );
}