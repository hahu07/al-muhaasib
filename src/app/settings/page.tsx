"use client";

import { Auth } from "@/components/home/auth";
import { SchoolSettings } from "@/components/settings/SchoolSettings";

export default function SettingsPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 dark:bg-gray-900">
        <SchoolSettings />
      </div>
    </Auth>
  );
}
