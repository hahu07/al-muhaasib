'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AccountingDashboard } from '@/components/dashboards/AccountingDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { Button } from '@/components/ui/button';
import { ShieldIcon, AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

export function DashboardRouter() {
  const { appUser, loading, isAdmin, isAccounting } = useAuth();

  // Loading state
  if (loading) {
    return <DashboardLoadingState />;
  }

  // No user found
  if (!appUser) {
    return <NoUserState />;
  }

  // Inactive user
  if (!appUser.isActive) {
    return <InactiveUserState user={appUser} />;
  }

  // Route to appropriate dashboard based on role
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isAccounting) {
    return <AccountingDashboard />;
  }

  // Unknown role fallback
  return <UnknownRoleState user={appUser} />;
}

// Loading state component
function DashboardLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <RefreshCwIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
        <p className="text-gray-600">Preparing your Al-Muhaasib experience...</p>
      </div>
    </div>
  );
}

// No user state
function NoUserState() {
  const handleCreateAdmin = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createUserProfile } = await import('@/services/userService');
      const { authSubscribe } = await import('@junobuild/core');
      
      // Get current user
      const unsubscribe = authSubscribe((user) => {
        if (user) {
          createUserProfile({
            internetIdentityId: user.key,
            surname: "Admin",
            firstname: "User",
            email: "",
            role: "admin",
            isActive: true,
            permissions: [
              "users.read",
              "users.write",
              "students.read",
              "students.write",
              "transactions.read", 
              "transactions.write",
              "reports.read",
              "system.read",
              "system.write",
            ],
          }).then(() => {
            window.location.reload();
          }).catch((error) => {
            console.error('Failed to create admin user:', error);
            alert('Failed to create admin account. Check console for details.');
          });
        }
        unsubscribe();
      });
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Account Setup Required</h2>
        <p className="mb-4">
          This is your first time signing in. Your user profile needs to be created.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 mb-2 font-semibold">
            First-time Setup:
          </p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click &quot;Create Admin Account&quot; below</li>
            <li>You&apos;ll be set up as the system administrator</li>
            <li>You can then create other user accounts</li>
          </ol>
        </div>
        <div className="space-y-3">
          <Button onClick={handleCreateAdmin} className="w-full">
            Create Admin Account
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Try Again
          </Button>
          <p className="text-xs text-gray-500">
            Note: Make sure your Juno satellite is properly configured
          </p>
        </div>
      </div>
    </div>
  );
}

// Inactive user state
function InactiveUserState({ user }: { user: { surname?: string; firstname?: string; email: string; role: string; lastLogin?: Date } }) {
  const fullName = user.firstname && user.surname ? `${user.firstname} ${user.surname}` : 'User';
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ShieldIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Inactive</h2>
        <p className="text-gray-600 mb-4">
          Hello {fullName}, your account has been deactivated.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            Please contact your system administrator to reactivate your account and regain access to Al-Muhaasib.
          </p>
        </div>
        <div className="space-y-2 text-xs text-gray-500">
          <p>Account: {user.email}</p>
          <p>Role: {user.role}</p>
          <p>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
}

// Unknown role state
function UnknownRoleState({ user }: { user: { surname?: string; firstname?: string; role?: string } }) {
  const fullName = user.firstname && user.surname ? `${user.firstname} ${user.surname}` : 'User';
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangleIcon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unknown User Role</h2>
        <p className="text-gray-600 mb-4">
          Hello {fullName}, your account role is not recognized.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-800 mb-2">
            Your current role: <strong>{user.role || 'undefined'}</strong>
          </p>
          <p className="text-sm text-orange-800">
            Al-Muhaasib supports &apos;admin&apos; and &apos;accounting&apos; roles. Please contact your administrator to update your role.
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
          Refresh Dashboard
        </Button>
      </div>
    </div>
  );
}