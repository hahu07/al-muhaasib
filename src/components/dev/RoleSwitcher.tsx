"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import type { UserRole } from "@/types";

const roles: { value: UserRole; label: string; color: string }[] = [
  {
    value: "super_admin",
    label: "Super Admin",
    color: "bg-purple-100 text-purple-800",
  },
  { value: "bursar", label: "Bursar", color: "bg-blue-100 text-blue-800" },
  {
    value: "accountant",
    label: "Accountant",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "auditor",
    label: "Auditor",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "data_entry",
    label: "Data Entry",
    color: "bg-gray-100 text-gray-800",
  },
];

interface RoleSwitcherProps {
  variant?: "floating" | "sidebar";
}

export function RoleSwitcher({ variant = "floating" }: RoleSwitcherProps) {
  const { appUser } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!appUser) return null;

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      setSwitching(true);

      // Update the user's role
      await userService.updateUserRole(appUser.id, newRole);

      // Reload the page to apply new permissions
      window.location.reload();
    } catch (error) {
      console.error("Error switching role:", error);
      alert("Failed to switch role. Check console for details.");
    } finally {
      setSwitching(false);
    }
  };

  const currentRole = roles.find((r) => r.value === appUser.role);

  const trigger = variant === "sidebar" ? (
    <Button
      variant="outline"
      className="w-full border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400"
      disabled={switching}
      size="sm"
    >
      <Shield className="mr-2 h-4 w-4" />
      <span className="flex-1 text-left text-xs">Testing as: {currentRole?.label}</span>
      {switching && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
    </Button>
  ) : (
    <Button
      variant="outline"
      className="border-2 border-orange-400 bg-white shadow-lg dark:bg-gray-800"
      disabled={switching}
    >
      <Shield className="mr-2 h-4 w-4" />
      <span className="mr-2 hidden sm:inline">Testing as:</span>
      <Badge className={currentRole?.color}>{currentRole?.label}</Badge>
      {switching && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
    </Button>
  );

  return (
    <div className={variant === "floating" ? "fixed bottom-4 right-4 z-50" : "w-full"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <span>Switch Role (Dev Mode)</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roles.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => handleSwitchRole(role.value)}
              disabled={appUser.role === role.value || switching}
              className="cursor-pointer"
            >
              <Badge className={`${role.color} mr-2`}>{role.label}</Badge>
              {appUser.role === role.value && (
                <span className="text-xs text-gray-500">(current)</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-gray-500">
            Page will reload after switching
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
