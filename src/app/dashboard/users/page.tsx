"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import type { AppUser, UserRole } from "@/types";
import { PERMISSIONS } from "@/types";

export default function UserManagementPage() {
  const { appUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [editForm, setEditForm] = useState({
    surname: "",
    firstname: "",
    email: "",
    role: "" as UserRole,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.list();
      setUsers(allUsers);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setEditForm({
      surname: "",
      firstname: "",
      email: "",
      role: "accountant",
    });
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setEditForm({
      surname: user.surname,
      firstname: user.firstname,
      email: user.email,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      setError(null);

      // Update basic info
      await userService.update(selectedUser.id, {
        surname: editForm.surname,
        firstname: editForm.firstname,
        email: editForm.email,
      });

      // Update role if changed
      if (editForm.role !== selectedUser.role) {
        await userService.updateUserRole(selectedUser.id, editForm.role);
      }

      setSuccess("User updated successfully");
      setIsEditDialogOpen(false);
      await loadUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: AppUser) => {
    try {
      if (user.isActive) {
        await userService.deactivateUser(user.id);
        setSuccess(`${user.firstname} ${user.surname} deactivated`);
      } else {
        await userService.activateUser(user.id);
        setSuccess(`${user.firstname} ${user.surname} activated`);
      }
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update user status:", err);
      setError("Failed to update user status");
    }
  };

  const handleResetPermissions = async (user: AppUser) => {
    try {
      await userService.resetPermissionsToDefault(user.id);
      setSuccess(`Permissions reset to ${user.role} defaults`);
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to reset permissions:", err);
      setError("Failed to reset permissions");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstname.toLowerCase().includes(searchLower) ||
      user.surname.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "bursar":
        return "bg-blue-100 text-blue-800";
      case "accountant":
        return "bg-green-100 text-green-800";
      case "auditor":
        return "bg-yellow-100 text-yellow-800";
      case "data_entry":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "bursar":
        return "Bursar";
      case "accountant":
        return "Accountant";
      case "auditor":
        return "Auditor";
      case "data_entry":
        return "Data Entry";
      default:
        return role;
    }
  };

  if (!hasPermission(PERMISSIONS.USERS_VIEW)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to view user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">
            Manage users, roles, and permissions
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.USERS_CREATE}>
          <Button onClick={handleAddUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PermissionGuard>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>Search and manage system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Role</th>
                  <th className="p-3 text-left font-medium">Permissions</th>
                  <th className="p-3 text-center font-medium">Status</th>
                  <th className="p-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">
                          {user.firstname} {user.surname}
                        </p>
                        {user.id === appUser?.id && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {user.email || "Not set"}
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsPermissionDialogOpen(true);
                        }}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {user.permissions.length} permissions
                      </Button>
                    </td>
                    <td className="p-3 text-center">
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <PermissionGuard permission={PERMISSIONS.USERS_EDIT}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            disabled={
                              user.id === appUser?.id &&
                              user.role === "super_admin"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard
                          permission={PERMISSIONS.USERS_MANAGE_ROLES}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={user.id === appUser?.id}
                          >
                            {user.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              How to add users to Al-Muhaasib
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Important:</strong> Users cannot be created directly.
              Here&apos;s the process:
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  User signs in with their <strong>Internet Identity</strong>
                </li>
                <li>System auto-creates their profile with default role</li>
                <li>You (as admin) update their role and permissions here</li>
              </ol>
            </AlertDescription>
          </Alert>
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="mb-2 text-sm font-semibold text-purple-800">
              💡 Testing Permissions?
            </p>
            <p className="text-sm text-purple-700">
              Use the <strong>Role Switcher</strong> button (top-right corner)
              to test different roles without creating additional users!
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAddDialogOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                value={editForm.firstname}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstname: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={editForm.surname}
                onChange={(e) =>
                  setEditForm({ ...editForm, surname: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="bursar">Bursar</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="data_entry">Data Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PermissionGuard>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
            <DialogDescription>
              {selectedUser &&
                `${selectedUser.firstname} ${selectedUser.surname} - ${getRoleLabel(selectedUser.role)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedUser.permissions.length} permissions assigned
                </p>
                <PermissionGuard permission={PERMISSIONS.USERS_MANAGE_ROLES}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPermissions(selectedUser)}
                  >
                    Reset to Defaults
                  </Button>
                </PermissionGuard>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedUser.permissions.map((permission) => (
                  <Badge
                    key={permission}
                    variant="secondary"
                    className="justify-center"
                  >
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPermissionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
