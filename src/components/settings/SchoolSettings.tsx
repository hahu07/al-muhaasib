"use client";

/**
 * SCHOOL SETTINGS COMPONENT
 *
 * Allows administrators to configure school information, branding,
 * academic settings, and system preferences.
 */

import React, { useState } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import {
  Building2,
  Palette,
  Calendar,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
} from "lucide-react";
import type { SchoolConfig, ModuleName } from "@/types";

export function SchoolSettings() {
  const { config, loading, error, updateConfig, refreshConfig } = useSchool();
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SchoolConfig>>(config || {});

  // Update form data when config loads
  React.useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleInputChange = (field: keyof SchoolConfig, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBrandingChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      branding: {
        primaryColor: prev.branding?.primaryColor || "#4F46E5",
        secondaryColor: prev.branding?.secondaryColor || "#7C3AED",
        accentColor: prev.branding?.accentColor || "#EC4899",
        ...prev.branding,
        [field]: value,
      },
    }));
  };

  const handleModuleToggle = (module: ModuleName) => {
    const currentModules = formData.enabledModules || [];
    const newModules = currentModules.includes(module)
      ? currentModules.filter((m) => m !== module)
      : [...currentModules, module];

    handleInputChange("enabledModules", newModules);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      await updateConfig(formData);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setSaveError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <Alert variant="destructive">
        <p>{error || "Failed to load school configuration"}</p>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            School Settings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Configure your school information and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshConfig} disabled={saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <Alert>
          <p className="text-green-600 dark:text-green-400">
            Settings saved successfully!
          </p>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <p>{saveError}</p>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="basic">
            <Building2 className="mr-2 h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="academic">
            <Calendar className="mr-2 h-4 w-4" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName || ""}
                  onChange={(e) =>
                    handleInputChange("schoolName", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="schoolCode">School Code</Label>
                <Input
                  id="schoolCode"
                  value={formData.schoolCode || ""}
                  disabled
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="motto">Motto</Label>
                <Input
                  id="motto"
                  value={formData.motto || ""}
                  onChange={(e) => handleInputChange("motto", e.target.value)}
                  placeholder="School motto or slogan"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state || ""}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Branding & Appearance
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.branding?.primaryColor || "#4F46E5"}
                    onChange={(e) =>
                      handleBrandingChange("primaryColor", e.target.value)
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    value={formData.branding?.primaryColor || "#4F46E5"}
                    onChange={(e) =>
                      handleBrandingChange("primaryColor", e.target.value)
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.branding?.secondaryColor || "#7C3AED"}
                    onChange={(e) =>
                      handleBrandingChange("secondaryColor", e.target.value)
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    value={formData.branding?.secondaryColor || "#7C3AED"}
                    onChange={(e) =>
                      handleBrandingChange("secondaryColor", e.target.value)
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.branding?.logo || ""}
                  onChange={(e) => handleBrandingChange("logo", e.target.value)}
                  placeholder="/path/to/logo.png"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Academic Settings Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Academic Settings</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="currentSession">Current Session</Label>
                <Input
                  id="currentSession"
                  value={formData.currentSession || ""}
                  onChange={(e) =>
                    handleInputChange("currentSession", e.target.value)
                  }
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency || ""}
                  onChange={(e) =>
                    handleInputChange("currency", e.target.value)
                  }
                  placeholder="NGN"
                />
              </div>
              <div>
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={formData.currencySymbol || ""}
                  onChange={(e) =>
                    handleInputChange("currencySymbol", e.target.value)
                  }
                  placeholder="₦"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Enabled Modules</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {(
                [
                  "students",
                  "fees",
                  "payments",
                  "expenses",
                  "staff",
                  "assets",
                  "reports",
                  "accounting",
                ] as ModuleName[]
              ).map((module) => (
                <label
                  key={module}
                  className="flex cursor-pointer items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.enabledModules?.includes(module) || false}
                    onChange={() => handleModuleToggle(module)}
                    className="rounded border-gray-300"
                  />
                  <span className="capitalize">{module}</span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Payment Settings</h2>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowPartialPayments || false}
                  onChange={(e) =>
                    handleInputChange("allowPartialPayments", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <span>Allow Partial Payments</span>
              </label>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
