import { Suspense } from "react";
import { FeeManagement } from "@/components/fees/FeeManagement";
import { Auth } from "@/components/home/auth";

function FeeManagementWrapper() {
  return <FeeManagement />;
}

export default function FeePage() {
  return (
    <Auth>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <FeeManagementWrapper />
      </Suspense>
    </Auth>
  );
}
