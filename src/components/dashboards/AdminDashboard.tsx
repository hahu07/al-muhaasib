'use client';

import React, { useState } from 'react';
import {
  DollarSignIcon,
  UsersIcon,
  CreditCardIcon,
  TrendingUpIcon,
  SettingsIcon,
  ShieldIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
} from 'lucide-react';
import { useFinancialDashboard, type FinancialDashboardData } from '@/hooks/useFinancialDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'settings'>('overview');
  const { data, loading, error } = useFinancialDashboard();
  const { appUser } = useAuth();
  
  const userName = appUser ? `${appUser.firstname} ${appUser.surname}` : 'User';

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Admin Dashboard
              </h1>
              <p className="text-sm text-blue-100">
                System administration • Welcome, {userName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" className="shrink-0 bg-white/20 hover:bg-white/30">
                <PlusIcon className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">New User</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <Button size="sm" variant="secondary" className="shrink-0 bg-white/20 hover:bg-white/30">
                <SettingsIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="mt-4 flex space-x-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3Icon className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <UsersIcon className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <TrendingUpIcon className="w-4 h-4" /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'analytics' | 'settings')}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
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
      <div className="p-4 sm:p-6 space-y-6">
        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// Admin Overview Tab
function OverviewTab({ data }: { data: FinancialDashboardData }) {
  return (
    <div className="space-y-6">
      {/* System Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Revenue"
          value={`₦${data.revenue.totalCollected.toLocaleString()}`}
          icon={<DollarSignIcon className="w-5 h-5 text-green-600" />}
          trend="+12%"
          trendColor="text-green-600"
          bgColor="bg-green-50"
        />
        <AdminStatCard
          title="Active Users"
          value="12" // This would come from user service
          icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
          trend="+2 this month"
          trendColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <AdminStatCard
          title="Students"
          value={data.students.totalStudents.toString()}
          icon={<UsersIcon className="w-5 h-5 text-purple-600" />}
          trend={`${data.students.paidStudents} paid up`}
          trendColor="text-green-600"
          bgColor="bg-purple-50"
        />
        <AdminStatCard
          title="Alerts"
          value={(data.alerts.overdueInvoices + data.alerts.pendingExpenses).toString()}
          icon={<AlertTriangleIcon className="w-5 h-5 text-red-600" />}
          trend="Requires attention"
          trendColor="text-red-600"
          bgColor="bg-red-50"
        />
      </div>

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-green-600" />
            System Health
          </h2>
          <div className="space-y-3">
            <HealthItem status="good" label="Database Connection" />
            <HealthItem status="good" label="Payment Gateway" />
            <HealthItem status="warning" label="Backup Status" details="Last backup: 2 hours ago" />
            <HealthItem status="good" label="User Sessions" details="12 active users" />
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <AdminActionButton
              icon={<PlusIcon className="w-5 h-5" />}
              label="Add User"
              onClick={() => {}}
            />
            <AdminActionButton
              icon={<DownloadIcon className="w-5 h-5" />}
              label="Export Data"
              onClick={() => {}}
            />
            <AdminActionButton
              icon={<BarChart3Icon className="w-5 h-5" />}
              label="Generate Report"
              onClick={() => {}}
            />
            <AdminActionButton
              icon={<SettingsIcon className="w-5 h-5" />}
              label="System Settings"
              onClick={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Admin Activity</h2>
        <div className="space-y-3">
          {([
            { action: 'User created', user: 'Admin', target: 'John Doe (Accounting)', time: '1 hour ago', type: 'create' as const },
            { action: 'Settings updated', user: 'Admin', target: 'Payment gateway config', time: '3 hours ago', type: 'update' as const },
            { action: 'Report exported', user: 'Admin', target: 'Monthly financial report', time: '5 hours ago', type: 'export' as const },
          ] as const).map((activity, i) => (
            <AdminActivityItem key={i} {...activity} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Users Management Tab
function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* User Management Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-500">Manage system users and their roles</p>
          </div>
          <Button size="sm" className="shrink-0">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button variant="outline" size="sm">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <UserStatCard title="Total Users" count="12" color="blue" />
        <UserStatCard title="Admin Users" count="3" color="purple" />
        <UserStatCard title="Accounting Staff" count="9" color="green" />
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Users</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { name: 'Sarah Ahmed', email: 'sarah@school.com', role: 'admin', status: 'active', lastLogin: '2 hours ago' },
            { name: 'John Doe', email: 'john@school.com', role: 'accounting', status: 'active', lastLogin: '5 hours ago' },
            { name: 'Mary Johnson', email: 'mary@school.com', role: 'accounting', status: 'inactive', lastLogin: '2 days ago' },
          ].map((user, i) => (
            <UserListItem key={i} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Analytics Tab
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Financial Analytics</h2>
        <p className="text-sm text-gray-500">Comprehensive system analytics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Growth"
          value="+12.5%"
          subtitle="vs last month"
          color="green"
        />
        <MetricCard
          title="Collection Rate"
          value="87.3%"
          subtitle="students paid"
          color="blue"
        />
        <MetricCard
          title="Average Payment"
          value="₦45,000"
          subtitle="per student"
          color="purple"
        />
        <MetricCard
          title="Outstanding"
          value="₦2.1M"
          subtitle="pending collection"
          color="yellow"
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Revenue Chart Placeholder</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Payment Methods Chart Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab() {
  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h2>
        <p className="text-sm text-gray-500">Configure system preferences and integrations</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsCard
          title="School Information"
          description="Update school name, logo, and contact details"
          icon={<SettingsIcon className="w-5 h-5 text-blue-600" />}
        />
        <SettingsCard
          title="Payment Gateway"
          description="Configure Paystack and other payment methods"
          icon={<CreditCardIcon className="w-5 h-5 text-green-600" />}
        />
        <SettingsCard
          title="User Permissions"
          description="Manage user roles and access controls"
          icon={<ShieldIcon className="w-5 h-5 text-purple-600" />}
        />
        <SettingsCard
          title="Backup & Security"
          description="Data backup settings and security preferences"
          icon={<AlertTriangleIcon className="w-5 h-5 text-red-600" />}
        />
      </div>
    </div>
  );
}

// Helper Components
function AdminStatCard({ title, value, icon, trend, trendColor, bgColor }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  bgColor?: string;
}) {
  return (
    <div className={`${bgColor || 'bg-white'} p-4 rounded-lg shadow-sm border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trendColor || 'text-gray-500'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminActionButton({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
    </button>
  );
}

function HealthItem({ status, label, details }: {
  status: 'good' | 'warning' | 'error';
  label: string;
  details?: string;
}) {
  const statusColors = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    good: '●',
    warning: '⚠',
    error: '●',
  };

  return (
    <div className="flex items-center justify-between p-2 rounded">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {statusIcons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      {details && <span className="text-xs text-gray-500">{details}</span>}
    </div>
  );
}

function AdminActivityItem({ action, user, target, time, type }: {
  action: string;
  user: string;
  target: string;
  time: string;
  type: 'create' | 'update' | 'export' | 'delete';
}) {
  const typeColors = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    export: 'bg-purple-100 text-purple-800',
    delete: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
        {type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {action}: {target}
        </p>
        <p className="text-xs text-gray-500">by {user} • {time}</p>
      </div>
    </div>
  );
}

function UserStatCard({ title, count, color }: {
  title: string;
  count: string;
  color: 'blue' | 'purple' | 'green';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1">{count}</p>
    </div>
  );
}

function UserListItem({ user }: {
  user: {
    name: string;
    email: string;
    role: string;
    status: string;
    lastLogin: string;
  };
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email} • Last login: {user.lastLogin}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            user.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {user.status}
          </span>
          <div className="flex gap-1">
            <button className="p-1 text-gray-400 hover:text-blue-600">
              <EyeIcon className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-green-600">
              <EditIcon className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-red-600">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: {
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'blue' | 'purple' | 'yellow';
}) {
  const colors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function SettingsCard({ title, description, icon }: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Loading and Error States
function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-200 h-24 animate-pulse"></div>
      <div className="p-4 sm:p-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-900 mb-2">Admin Dashboard Error</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Reload Dashboard
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <BarChart3Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Dashboard Data</h2>
        <p className="text-gray-500 mb-4">Admin dashboard data is not available</p>
        <Button onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}