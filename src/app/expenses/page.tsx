'use client';

import React from 'react';
import { ExpenseManagement } from '@/components/expenses/ExpenseManagement';
import { Auth } from '@/components/home/auth';

export default function ExpensesPage() {
  return (
    <Auth>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
        <ExpenseManagement />
      </div>
    </Auth>
  );
}