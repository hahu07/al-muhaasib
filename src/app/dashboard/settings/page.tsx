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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  School,
  Palette,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Blocks,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { schoolConfigService } from "@/services/schoolConfigService";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import type { SchoolConfig, AcademicTerm, ModuleName } from "@/types";
import { EnhancedBrandingSettings } from "@/components/settings/EnhancedBrandingSettings";
import { BankAccountSettings } from "@/components/settings/BankAccountSettings";

type TabType =
  | "general"
  | "branding"
  | "academic"
  | "regional"
  | "modules"
  | "payments";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const { refreshConfig: refreshSchoolContext } = useSchool();
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    schoolName: "",
    motto: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
  });

  const [brandingForm, setBrandingForm] = useState({
    primaryColor: "#4F46E5",
    secondaryColor: "#7C3AED",
    accentColor: "#EC4899",
    logo: "",
  });

  const [academicForm, setAcademicForm] = useState({
    currentSession: "",
    currentTerm: "first" as AcademicTerm,
  });

  const [regionalForm, setRegionalForm] = useState({
    currency: "NGN",
    currencySymbol: "₦",
    timezone: "Africa/Lagos",
    locale: "en-NG",
    dateFormat: "DD/MM/YYYY",
  });

  const [modulesForm, setModulesForm] = useState<ModuleName[]>([]);

  const [paymentsForm, setPaymentsForm] = useState({
    allowPartialPayments: true,
    lateFeePercentage: 0,
    defaultPaymentMethods: [] as Array<
      "cash" | "bank_transfer" | "pos" | "online" | "cheque"
    >,
  });

  const [showModuleWarning, setShowModuleWarning] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    module: ModuleName | null;
  }>({ show: false, module: null });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const schoolConfig = await schoolConfigService.getConfig();

      if (schoolConfig) {
        setConfig(schoolConfig);

        // Populate forms
        setGeneralForm({
          schoolName: schoolConfig.schoolName,
          motto: schoolConfig.motto || "",
          address: schoolConfig.address,
          city: schoolConfig.city,
          state: schoolConfig.state,
          country: schoolConfig.country,
          postalCode: schoolConfig.postalCode || "",
          phone: schoolConfig.phone,
          email: schoolConfig.email,
          website: schoolConfig.website || "",
        });

        setBrandingForm({
          primaryColor: schoolConfig.branding.primaryColor,
          secondaryColor: schoolConfig.branding.secondaryColor,
          accentColor: schoolConfig.branding.accentColor,
          logo: schoolConfig.branding.logo || "",
        });

        setAcademicForm({
          currentSession: schoolConfig.currentSession,
          currentTerm: schoolConfig.currentTerm,
        });

        setRegionalForm({
          currency: schoolConfig.currency,
          currencySymbol: schoolConfig.currencySymbol,
          timezone: schoolConfig.timezone,
          locale: schoolConfig.locale,
          dateFormat: schoolConfig.dateFormat,
        });

        setModulesForm(schoolConfig.enabledModules);

        setPaymentsForm({
          allowPartialPayments: schoolConfig.allowPartialPayments,
          lateFeePercentage: schoolConfig.lateFeePercentage || 0,
          defaultPaymentMethods: schoolConfig.defaultPaymentMethods,
        });
      }
    } catch (err) {
      console.error("Error loading config:", err);
      setError("Failed to load school configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateConfig(config.id, {
        schoolName: generalForm.schoolName,
        motto: generalForm.motto,
        address: generalForm.address,
        city: generalForm.city,
        state: generalForm.state,
        country: generalForm.country,
        postalCode: generalForm.postalCode,
        phone: generalForm.phone,
        email: generalForm.email,
        website: generalForm.website,
      });

      setSuccess("General settings saved successfully!");
      await loadConfig();
    } catch (err) {
      console.error("Error saving general settings:", err);
      setError("Failed to save general settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateBranding(config.id, {
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
        accentColor: brandingForm.accentColor,
        logo: brandingForm.logo,
      });

      setSuccess("Branding settings saved successfully!");
      await loadConfig();
    } catch (err) {
      console.error("Error saving branding:", err);
      setError("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAcademic = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateAcademicSettings(config.id, {
        currentSession: academicForm.currentSession,
        currentTerm: academicForm.currentTerm,
      });

      setSuccess("Academic settings saved successfully!");
      await loadConfig();
    } catch (err) {
      console.error("Error saving academic settings:", err);
      setError("Failed to save academic settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRegional = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateConfig(config.id, {
        currency: regionalForm.currency,
        currencySymbol: regionalForm.currencySymbol,
        timezone: regionalForm.timezone,
        locale: regionalForm.locale,
        dateFormat: regionalForm.dateFormat,
      });

      setSuccess("Regional settings saved successfully!");
      await loadConfig();
    } catch (err) {
      console.error("Error saving regional settings:", err);
      setError("Failed to save regional settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModules = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateConfig(config.id, {
        enabledModules: modulesForm,
      });

      setSuccess("Module settings saved successfully!");
      await loadConfig();
      // Refresh SchoolContext so module restrictions take effect
      await refreshSchoolContext();
    } catch (err) {
      console.error("Error saving module settings:", err);
      setError("Failed to save module settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayments = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await schoolConfigService.updateConfig(config.id, {
        allowPartialPayments: paymentsForm.allowPartialPayments,
        lateFeePercentage: paymentsForm.lateFeePercentage,
        defaultPaymentMethods: paymentsForm.defaultPaymentMethods,
      });

      setSuccess("Payment settings saved successfully!");
      await loadConfig();
      // Refresh SchoolContext so forms pick up new payment methods
      await refreshSchoolContext();
    } catch (err) {
      console.error("Error saving payment settings:", err);
      setError("Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = (module: ModuleName) => {
    const isCurrentlyEnabled = modulesForm.includes(module);
    
    if (isCurrentlyEnabled) {
      // Show confirmation dialog when disabling a module
      setConfirmDialog({ show: true, module });
    } else {
      // Enable module directly
      setModulesForm((prev) => [...prev, module]);
    }
  };

  const confirmDisableModule = () => {
    if (confirmDialog.module) {
      setModulesForm((prev) => prev.filter((m) => m !== confirmDialog.module));
    }
    setConfirmDialog({ show: false, module: null });
  };

  const getModuleImplications = (module: ModuleName): string[] => {
    const implications: Record<ModuleName, string[]> = {
      students: [
        "Student profiles and enrollment records will be hidden",
        "Class assignment and student data management will be unavailable",
        "Student-related reports will not be accessible"
      ],
      fees: [
        "Fee structure configuration will be disabled",
        "Fee categories and amounts cannot be managed",
        "Fee assignment to students will not be possible",
        "Fee-related reports will be unavailable"
      ],
      payments: [
        "Payment recording and tracking will be disabled",
        "Payment receipts cannot be generated",
        "Payment history and analytics will be hidden",
        "Outstanding balance tracking will not work"
      ],
      expenses: [
        "Expense recording and management will be disabled",
        "Expense approval workflows will not function",
        "Expense categories and tracking will be unavailable",
        "Expense reports and analytics will be hidden"
      ],
      staff: [
        "Staff profiles and management will be disabled",
        "Payroll processing and salary management will not work",
        "Staff attendance and leave management will be unavailable",
        "HR-related reports will be hidden"
      ],
      assets: [
        "Fixed asset tracking will be disabled",
        "Asset depreciation calculations will not work",
        "Asset maintenance records will be unavailable",
        "Asset valuation reports will be hidden"
      ],
      reports: [
        "All financial and operational reports will be disabled",
        "Data export and analytics features will not work",
        "Dashboard insights and charts will be limited",
        "Compliance reporting will be unavailable"
      ],
      accounting: [
        "Chart of accounts management will be disabled",
        "Journal entries and double-entry bookkeeping will not work",
        "Trial balance and financial statements will be unavailable",
        "Advanced accounting features will be hidden"
      ],
      banking: [
        "Bank account management will be disabled",
        "Transaction import and reconciliation will not work",
        "Cash flow tracking will be unavailable",
        "Banking reports and analytics will be hidden"
      ]
    };
    
    return implications[module] || [];
  };

  const handleTogglePaymentMethod = (
    method: "cash" | "bank_transfer" | "pos" | "online" | "cheque",
  ) => {
    setPaymentsForm((prev) => ({
      ...prev,
      defaultPaymentMethods: prev.defaultPaymentMethods.includes(method)
        ? prev.defaultPaymentMethods.filter((m) => m !== method)
        : [...prev.defaultPaymentMethods, method],
    }));
  };

  const tabs = [
    { id: "general", label: "General", icon: <School className="h-4 w-4" /> },
    {
      id: "branding",
      label: "Branding",
      icon: <Palette className="h-4 w-4" />,
    },
    {
      id: "academic",
      label: "Academic",
      icon: <Calendar className="h-4 w-4" />,
    },
    { id: "regional", label: "Regional", icon: <Globe className="h-4 w-4" /> },
    { id: "modules", label: "Modules", icon: <Blocks className="h-4 w-4" /> },
    {
      id: "payments",
      label: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            School configuration not found. Please run the setup wizard first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              School Settings
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage your school&apos;s configuration and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSuccess(null);
                setError(null);
              }}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                General Information
              </CardTitle>
              <CardDescription>
                Basic information about your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    value={generalForm.schoolName}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        schoolName: e.target.value,
                      })
                    }
                    placeholder="Enter school name"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="motto">School Motto</Label>
                  <Input
                    id="motto"
                    value={generalForm.motto}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, motto: e.target.value })
                    }
                    placeholder="e.g., Excellence in Education"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={generalForm.address}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        address: e.target.value,
                      })
                    }
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={generalForm.city}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={generalForm.state}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={generalForm.country}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        country: e.target.value,
                      })
                    }
                    placeholder="Country"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={generalForm.postalCode}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="Postal code"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={generalForm.phone}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, phone: e.target.value })
                    }
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    <Mail className="mr-1 inline h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalForm.email}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, email: e.target.value })
                    }
                    placeholder="info@school.edu"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website">
                    <Globe className="mr-1 inline h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={generalForm.website}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://www.school.edu"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branding Settings */}
        {activeTab === "branding" && <EnhancedBrandingSettings />}

        {/* Academic Settings */}
        {activeTab === "academic" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Settings
              </CardTitle>
              <CardDescription>
                Configure academic year and term information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currentSession">
                    Current Academic Session
                  </Label>
                  <Input
                    id="currentSession"
                    value={academicForm.currentSession}
                    onChange={(e) =>
                      setAcademicForm({
                        ...academicForm,
                        currentSession: e.target.value,
                      })
                    }
                    placeholder="e.g., 2024/2025"
                  />
                </div>

                <div>
                  <Label htmlFor="currentTerm">Current Term</Label>
                  <select
                    id="currentTerm"
                    value={academicForm.currentTerm}
                    onChange={(e) =>
                      setAcademicForm({
                        ...academicForm,
                        currentTerm: e.target.value as AcademicTerm,
                      })
                    }
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                  </select>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Changing the current session or term
                  will affect fee structures, reports, and academic records
                  across the system.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAcademic} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regional Settings */}
        {activeTab === "regional" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure currency, timezone, and locale preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Currency Code</Label>
                  <Input
                    id="currency"
                    value={regionalForm.currency}
                    onChange={(e) =>
                      setRegionalForm({
                        ...regionalForm,
                        currency: e.target.value,
                      })
                    }
                    placeholder="NGN, USD, GBP, EUR"
                  />
                </div>

                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={regionalForm.currencySymbol}
                    onChange={(e) =>
                      setRegionalForm({
                        ...regionalForm,
                        currencySymbol: e.target.value,
                      })
                    }
                    placeholder="₦, $, £, €"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={regionalForm.timezone}
                    onChange={(e) =>
                      setRegionalForm({
                        ...regionalForm,
                        timezone: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Johannesburg">
                      Africa/Johannesburg (SAST)
                    </option>
                    <option value="Europe/London">
                      Europe/London (GMT/BST)
                    </option>
                    <option value="America/New_York">
                      America/New_York (EST/EDT)
                    </option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="locale">Locale</Label>
                  <select
                    id="locale"
                    value={regionalForm.locale}
                    onChange={(e) =>
                      setRegionalForm({
                        ...regionalForm,
                        locale: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="en-NG">English (Nigeria)</option>
                    <option value="en-US">English (United States)</option>
                    <option value="en-GB">English (United Kingdom)</option>
                    <option value="ar-SA">Arabic (Saudi Arabia)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    value={regionalForm.dateFormat}
                    onChange={(e) =>
                      setRegionalForm({
                        ...regionalForm,
                        dateFormat: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (17/01/2025)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (01/17/2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-01-17)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveRegional} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules Settings */}
        {activeTab === "modules" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Blocks className="h-5 w-5" />
                Module Management
              </CardTitle>
              <CardDescription>
                Enable or disable features for your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showModuleWarning && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                  <AlertDescription className="flex items-start justify-between text-sm text-blue-800 dark:text-blue-300">
                    <span>
                      <strong>Tip:</strong> Disable modules you don&apos;t need to
                      simplify your interface. You can always re-enable them later.
                    </span>
                    <button
                      onClick={() => setShowModuleWarning(false)}
                      className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      aria-label="Dismiss warning"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  {
                    id: "students",
                    label: "Students",
                    description: "Student profiles and enrollment management",
                  },
                  {
                    id: "fees",
                    label: "Fees",
                    description: "Fee structure and fee assignments",
                  },
                  {
                    id: "payments",
                    label: "Payments",
                    description: "Payment recording and tracking",
                  },
                  {
                    id: "expenses",
                    label: "Expenses",
                    description: "Operational expense management",
                  },
                  {
                    id: "staff",
                    label: "Staff & Payroll",
                    description: "Staff management and salary processing",
                  },
                  {
                    id: "assets",
                    label: "Assets",
                    description: "Fixed asset and depreciation tracking",
                  },
                  {
                    id: "reports",
                    label: "Reports",
                    description: "Financial and operational reports",
                  },
                  {
                    id: "accounting",
                    label: "Accounting",
                    description: "Chart of accounts and journal entries",
                  },
                  {
                    id: "banking",
                    label: "Banking",
                    description: "Bank transactions, reconciliation, and cash flow",
                  },
                ].map((module) => (
                  <div
                    key={module.id}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      modulesForm.includes(module.id as ModuleName)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    }`}
                    onClick={() => handleToggleModule(module.id as ModuleName)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {module.label}
                          </h4>
                          {modulesForm.includes(module.id as ModuleName) ? (
                            <ToggleRight className="h-5 w-5 text-blue-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveModules} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments Settings */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment methods and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Allow Partial Payments
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Enable students to pay fees in installments
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setPaymentsForm({
                        ...paymentsForm,
                        allowPartialPayments:
                          !paymentsForm.allowPartialPayments,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      paymentsForm.allowPartialPayments
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        paymentsForm.allowPartialPayments
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <Label htmlFor="lateFeePercentage">
                    Late Payment Fee (%)
                  </Label>
                  <Input
                    id="lateFeePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={paymentsForm.lateFeePercentage}
                    onChange={(e) =>
                      setPaymentsForm({
                        ...paymentsForm,
                        lateFeePercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Percentage to add as penalty for late fee payments (0 for no
                    penalty)
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                  Accepted Payment Methods
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    {
                      id: "cash",
                      label: "Cash",
                      description: "Physical cash payments",
                    },
                    {
                      id: "bank_transfer",
                      label: "Bank Transfer",
                      description: "Direct bank transfers",
                    },
                    {
                      id: "pos",
                      label: "POS/Card",
                      description: "Point of sale / debit/credit card",
                    },
                    {
                      id: "online",
                      label: "Online Payment",
                      description: "Online payment gateways",
                    },
                    {
                      id: "cheque",
                      label: "Cheque",
                      description: "Bank cheque payments",
                    },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                        paymentsForm.defaultPaymentMethods.includes(
                          method.id as 'cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque',
                        )
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      onClick={() =>
                        handleTogglePaymentMethod(method.id as 'cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque')
                      }
                    >
                      <div className="flex items-center gap-2">
                        {paymentsForm.defaultPaymentMethods.includes(
                          method.id as 'cash' | 'bank_transfer' | 'pos' | 'online' | 'cheque',
                        ) ? (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{method.label}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSavePayments} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank Account Settings - only shown in Payments tab */}
        {activeTab === "payments" && config && (
          <BankAccountSettings config={config} onUpdate={loadConfig} />
        )}
      </div>

      {/* School Info Summary */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-sm">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">School Code</p>
              <p className="font-mono font-semibold">{config.schoolCode}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Session</p>
              <p className="font-semibold">{config.currentSession}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Term</p>
              <p className="font-semibold capitalize">
                {config.currentTerm} Term
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Currency</p>
              <p className="font-semibold">
                {config.currencySymbol} {config.currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Disabling Modules */}
      <Dialog
        open={confirmDialog.show}
        onOpenChange={(open) =>
          setConfirmDialog({ show: open, module: confirmDialog.module })
        }
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Disable Module?
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.module && (
                <span className="font-semibold capitalize">
                  {confirmDialog.module.replace("_", " ")}
                </span>
              )}{" "}
              module will be disabled. This will affect the following features:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {confirmDialog.module && (
              <ul className="space-y-2">
                {getModuleImplications(confirmDialog.module).map(
                  (implication, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="mt-1 text-orange-500">•</span>
                      <span>{implication}</span>
                    </li>
                  ),
                )}
              </ul>
            )}
            <div className="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> Your existing data will not be deleted. You
                can re-enable this module anytime to restore functionality.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ show: false, module: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDisableModule}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Disable Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
