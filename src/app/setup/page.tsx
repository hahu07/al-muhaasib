"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  School,
  User,
  Building,
  Loader2,
} from "lucide-react";
import { schoolConfigService } from "@/services/schoolConfigService";
import { updateUserProfile } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

interface SetupData {
  // User Profile
  firstname: string;
  surname: string;
  email: string;

  // School Information
  schoolName: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  schoolEmail: string;
}

export default function SetupWizard() {
  const router = useRouter();
  const { user, appUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setupData, setSetupData] = useState<SetupData>({
    firstname: "",
    surname: "",
    email: "",
    schoolName: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    schoolEmail: "",
  });

  const totalSteps = 3;

  const handleInputChange = (field: keyof SetupData, value: string) => {
    setSetupData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!setupData.firstname.trim() || !setupData.surname.trim()) {
          setError("Please enter your first name and surname");
          return false;
        }
        if (
          setupData.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(setupData.email)
        ) {
          setError("Please enter a valid email address");
          return false;
        }
        return true;

      case 2:
        if (!setupData.schoolName.trim()) {
          setError("Please enter the school name");
          return false;
        }
        if (!setupData.city.trim() || !setupData.state.trim()) {
          setError("Please enter the city and state");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;
    if (!user || !appUser) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Update user profile to super_admin
      await updateUserProfile(appUser.id, {
        firstname: setupData.firstname,
        surname: setupData.surname,
        email: setupData.email,
        role: "super_admin",
        isActive: true,
      });

      // Step 2: Create school configuration
      await schoolConfigService.createDefaultConfig(
        setupData.schoolName,
        user.key, // Use Internet Identity as satelliteId
        appUser.id,
      );

      // Step 3: Update school config with provided details
      const config = await schoolConfigService.getConfig();
      if (config) {
        await schoolConfigService.updateConfig(config.id, {
          address: setupData.address,
          city: setupData.city,
          state: setupData.state,
          phone: setupData.phone,
          email: setupData.schoolEmail,
        });
      }

      // Success! Redirect to dashboard
      router.push("/dashboard?setup=complete");
    } catch (err) {
      console.error("Setup error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete setup");
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up your administrator account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firstname">First Name *</Label>
                <Input
                  id="firstname"
                  value={setupData.firstname}
                  onChange={(e) =>
                    handleInputChange("firstname", e.target.value)
                  }
                  placeholder="Enter your first name"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={setupData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  placeholder="Enter your surname"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={setupData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <School className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">School Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basic details about your school
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={setupData.schoolName}
                  onChange={(e) =>
                    handleInputChange("schoolName", e.target.value)
                  }
                  placeholder="e.g., Al-Muhaasib International School"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={setupData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Street address"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={setupData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="e.g., Kano"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={setupData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="e.g., Kano"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  value={setupData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="e.g., +234 xxx xxx xxxx"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="schoolEmail">School Email (Optional)</Label>
                <Input
                  id="schoolEmail"
                  type="email"
                  value={setupData.schoolEmail}
                  onChange={(e) =>
                    handleInputChange("schoolEmail", e.target.value)
                  }
                  placeholder="info@school.edu.ng"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Review & Confirm</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please review your information
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Profile
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <span className="font-medium">
                      {setupData.firstname} {setupData.surname}
                    </span>
                  </div>
                  {setupData.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Email:
                      </span>
                      <span className="font-medium">{setupData.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Role:
                    </span>
                    <span className="font-medium text-green-600">
                      Super Administrator
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  School Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      School:
                    </span>
                    <span className="font-medium">{setupData.schoolName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Location:
                    </span>
                    <span className="font-medium">
                      {setupData.city}, {setupData.state}
                    </span>
                  </div>
                  {setupData.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Address:
                      </span>
                      <span className="text-right font-medium">
                        {setupData.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  You will become the <strong>Super Administrator</strong> with
                  full system access. You can create additional admin accounts
                  later.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Welcome to Al-Muhaasib
            </CardTitle>
            <div className="text-sm font-medium text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <CardDescription>
            Let&apos;s set up your school accounting system
          </CardDescription>

          {/* Progress bar */}
          <div className="pt-4">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index < currentStep
                      ? "bg-blue-600"
                      : index === currentStep - 1
                        ? "bg-blue-400"
                        : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}

          <div className="mt-8 flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
