"use client";

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, TagIcon, BookOpenIcon, UsersIcon, BarChart3Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { FeeCategoriesManagement } from './FeeCategoriesManagement';
import { FeeStructureManagement } from './FeeStructureManagement';
import { FeeAssignment } from './FeeAssignment';
import { FeeOverviewDashboard } from './FeeOverviewDashboard';

export function FeeManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'structures' | 'assignments'>('overview');

  // Handle URL query parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'categories', 'structures', 'assignments'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'categories' | 'structures' | 'assignments');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/students')}
                className="shrink-0"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Students
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold sm:text-2xl text-gray-900 dark:text-blue-300 truncate">
                  Fee Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-blue-300 opacity-70">
                  Manage fee categories and structures for your school
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex space-x-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3Icon className="w-4 h-4" /> },
              { id: 'structures', label: 'Fee Structures', icon: <BookOpenIcon className="w-4 h-4" /> },
              { id: 'assignments', label: 'Fee Assignment', icon: <UsersIcon className="w-4 h-4" /> },
              { id: 'categories', label: 'Fee Categories', icon: <TagIcon className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const newTab = tab.id as 'overview' | 'categories' | 'structures' | 'assignments';
                  setActiveTab(newTab);
                  // Update URL without page reload
                  const url = newTab === 'overview' ? '/fees' : `/fees?tab=${newTab}`;
                  router.push(url);
                }}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'overview' && <FeeOverviewDashboard />}
        {activeTab === 'categories' && <FeeCategoriesManagement />}
        {activeTab === 'structures' && <FeeStructureManagement />}
        {activeTab === 'assignments' && <FeeAssignment />}
      </div>
    </div>
  );
}