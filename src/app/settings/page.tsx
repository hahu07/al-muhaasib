'use client';

import { Auth } from '@/components/home/auth';
import { SchoolSettings } from '@/components/settings/SchoolSettings';

export default function SettingsPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <SchoolSettings />
      </div>
    </Auth>
  );
}
