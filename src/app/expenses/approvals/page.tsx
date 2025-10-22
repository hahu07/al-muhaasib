"use client";

import React from "react";
import { ExpenseApprovalDashboard } from "@/components/expenses/ExpenseApprovalDashboard";
import { Auth } from "@/components/home/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExpenseApprovalsPage() {
  const router = useRouter();

  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-950">
        {/* Header with back navigation */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/expenses")}
            variant="outline"
            size="sm"
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Expenses
          </Button>
        </div>

        {/* Main Dashboard */}
        <ExpenseApprovalDashboard />
      </div>
    </Auth>
  );
}
