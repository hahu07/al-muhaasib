"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  Building2,
  Banknote,
  Calendar,
  Hash,
} from "lucide-react";
import { staffService } from "@/services/staffService";
import type { StaffMember, StaffAllowance } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface StaffFormProps {
  staff?: StaffMember | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface AllowanceForm {
  name: string;
  amount: number;
  isRecurring: boolean;
}

export default function StaffForm({
  staff,
  onSuccess,
  onCancel,
}: StaffFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    surname: staff?.surname || "",
    firstname: staff?.firstname || "",
    middlename: staff?.middlename || "",
    staffNumber: staff?.staffNumber || "",
    phone: staff?.phone || "",
    email: staff?.email || "",
    address: staff?.address || "",
    position: staff?.position || "",
    department: staff?.department || "",
    employmentType: staff?.employmentType || ("full-time" as const),
    employmentDate: staff?.employmentDate || "",
    basicSalary: staff?.basicSalary || 0,
    bankName: staff?.bankName || "",
    accountNumber: staff?.accountNumber || "",
    isActive: staff?.isActive ?? true,
  });

  const [allowances, setAllowances] = useState<AllowanceForm[]>(
    staff?.allowances?.map((a) => ({ ...a })) || [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate staff number if creating new staff
  useEffect(() => {
    if (!staff && !formData.staffNumber) {
      const generateStaffNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0");
        return `STF-${year}-${random}`;
      };
      setFormData((prev) => ({ ...prev, staffNumber: generateStaffNumber() }));
    }
  }, [staff, formData.staffNumber]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.surname.trim()) newErrors.surname = "Surname is required";
    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required";
    if (!formData.staffNumber.trim())
      newErrors.staffNumber = "Staff number is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.employmentDate)
      newErrors.employmentDate = "Employment date is required";
    if (formData.basicSalary <= 0)
      newErrors.basicSalary = "Basic salary must be greater than 0";

    // Validation rules
    if (formData.surname.length > 50)
      newErrors.surname = "Surname cannot exceed 50 characters";
    if (formData.firstname.length > 50)
      newErrors.firstname = "First name cannot exceed 50 characters";
    if (formData.middlename && formData.middlename.length > 50) {
      newErrors.middlename = "Middle name cannot exceed 50 characters";
    }
    if (formData.staffNumber.length < 3 || formData.staffNumber.length > 20) {
      newErrors.staffNumber =
        "Staff number must be between 3 and 20 characters";
    }
    if (formData.position.length > 100) {
      newErrors.position = "Position cannot exceed 100 characters";
    }

    // Phone validation (basic Nigerian format)
    const phoneRegex = /^(\+234|0)[789]\d{9}$/;
    if (
      formData.phone &&
      !phoneRegex.test(formData.phone.replace(/[\s-]/g, ""))
    ) {
      newErrors.phone = "Invalid phone number format";
    }

    // Email validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    // Salary validation
    if (formData.basicSalary < 30000) {
      newErrors.basicSalary =
        "Basic salary cannot be below minimum wage (₦30,000)";
    }
    if (formData.basicSalary > 10000000) {
      newErrors.basicSalary = "Basic salary cannot exceed ₦10,000,000";
    }

    // Employment type specific validation
    if (
      formData.employmentType === "contract" &&
      formData.basicSalary > 5000000
    ) {
      newErrors.basicSalary = "Contract staff salary cannot exceed ₦5,000,000";
    }
    if (
      formData.employmentType === "part-time" &&
      formData.basicSalary > 3000000
    ) {
      newErrors.basicSalary = "Part-time staff salary cannot exceed ₦3,000,000";
    }

    // Banking details validation
    const hasBankName = formData.bankName.trim();
    const hasAccountNumber = formData.accountNumber.trim();
    if (hasBankName && !hasAccountNumber) {
      newErrors.accountNumber =
        "Account number required when bank name is provided";
    }
    if (hasAccountNumber && !hasBankName) {
      newErrors.bankName = "Bank name required when account number is provided";
    }
    if (hasAccountNumber && hasAccountNumber.length !== 10) {
      newErrors.accountNumber = "Account number must be 10 digits";
    }

    // High salary requirements
    if (formData.basicSalary > 1000000 && !formData.department) {
      newErrors.department = "Department required for salaries over ₦1,000,000";
    }
    if (formData.basicSalary > 5000000 && (!hasBankName || !hasAccountNumber)) {
      newErrors.bankName =
        "Banking details required for salaries over ₦5,000,000";
    }

    // Allowances validation
    allowances.forEach((allowance, index) => {
      if (!allowance.name.trim()) {
        newErrors[`allowance_${index}_name`] = "Allowance name is required";
      }
      if (allowance.amount <= 0) {
        newErrors[`allowance_${index}_amount`] =
          "Allowance amount must be greater than 0";
      }
      if (allowance.amount > 1000000) {
        newErrors[`allowance_${index}_amount`] =
          "Allowance amount cannot exceed ₦1,000,000";
      }
    });

    // Total allowances validation
    const totalAllowances = allowances.reduce(
      (sum, a) => sum + (a.amount || 0),
      0,
    );
    if (totalAllowances > formData.basicSalary * 2) {
      newErrors.allowances =
        "Total allowances cannot exceed 200% of basic salary";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    name: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addAllowance = () => {
    if (allowances.length >= 20) {
      toast({
        title: "Limit Reached",
        description: "Cannot add more than 20 allowances per staff member",
        variant: "destructive",
      });
      return;
    }
    setAllowances((prev) => [
      ...prev,
      { name: "", amount: 0, isRecurring: true },
    ]);
  };

  const removeAllowance = (index: number) => {
    setAllowances((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAllowance = (
    index: number,
    field: keyof AllowanceForm,
    value: string | number | boolean,
  ) => {
    setAllowances((prev) =>
      prev.map((allowance, i) =>
        i === index ? { ...allowance, [field]: value } : allowance,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const staffData = {
        ...formData,
        allowances:
          allowances.length > 0 ? (allowances as StaffAllowance[]) : undefined,
      };

      if (staff) {
        await staffService.update(staff.id, staffData);
        toast({
          title: "Staff Updated",
          description: `${formData.firstname} ${formData.surname} has been updated successfully`,
        });
      } else {
        await staffService.create(staffData);
        toast({
          title: "Staff Added",
          description: `${formData.firstname} ${formData.surname} has been added successfully`,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save staff member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCompensation =
    formData.basicSalary +
    allowances.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-6 p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <User className="h-4 w-4" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="surname">Surname *</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => handleInputChange("surname", e.target.value)}
                className={errors.surname ? "border-red-500" : ""}
              />
              {errors.surname && (
                <p className="mt-1 text-sm text-red-500">{errors.surname}</p>
              )}
            </div>

            <div>
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => handleInputChange("firstname", e.target.value)}
                className={errors.firstname ? "border-red-500" : ""}
              />
              {errors.firstname && (
                <p className="mt-1 text-sm text-red-500">{errors.firstname}</p>
              )}
            </div>

            <div>
              <Label htmlFor="middlename">Middle Name</Label>
              <Input
                id="middlename"
                value={formData.middlename}
                onChange={(e) =>
                  handleInputChange("middlename", e.target.value)
                }
                className={errors.middlename ? "border-red-500" : ""}
              />
              {errors.middlename && (
                <p className="mt-1 text-sm text-red-500">{errors.middlename}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Phone className="h-4 w-4" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g., 08012345678"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={2}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Building2 className="h-4 w-4" />
            Employment Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="staffNumber">Staff Number *</Label>
              <Input
                id="staffNumber"
                value={formData.staffNumber}
                onChange={(e) =>
                  handleInputChange("staffNumber", e.target.value)
                }
                className={errors.staffNumber ? "border-red-500" : ""}
              />
              {errors.staffNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.staffNumber}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                className={errors.position ? "border-red-500" : ""}
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-500">{errors.position}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                className={errors.department ? "border-red-500" : ""}
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value) =>
                  handleInputChange(
                    "employmentType",
                    value as typeof formData.employmentType,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="employmentDate">Employment Date *</Label>
              <Input
                id="employmentDate"
                type="date"
                value={formData.employmentDate}
                onChange={(e) =>
                  handleInputChange("employmentDate", e.target.value)
                }
                className={errors.employmentDate ? "border-red-500" : ""}
              />
              {errors.employmentDate && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.employmentDate}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-gray-500">
                  Staff member is currently active
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Banknote className="h-4 w-4" />
            Salary Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="basicSalary">Basic Salary (₦) *</Label>
              <Input
                id="basicSalary"
                type="number"
                min="0"
                step="0.01"
                value={formData.basicSalary}
                onChange={(e) =>
                  handleInputChange(
                    "basicSalary",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className={errors.basicSalary ? "border-red-500" : ""}
              />
              {errors.basicSalary && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.basicSalary}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Total Monthly Compensation
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{totalCompensation.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Allowances */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-4 w-4" />
              Allowances
            </h3>
            <Button
              type="button"
              onClick={addAllowance}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Allowance
            </Button>
          </div>

          {errors.allowances && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errors.allowances}</p>
            </div>
          )}

          <div className="space-y-3">
            {allowances.map((allowance, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`allowance_${index}_name`}>
                      Allowance Name
                    </Label>
                    <Input
                      id={`allowance_${index}_name`}
                      value={allowance.name}
                      onChange={(e) =>
                        updateAllowance(index, "name", e.target.value)
                      }
                      placeholder="e.g., Transport Allowance"
                      className={
                        errors[`allowance_${index}_name`]
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors[`allowance_${index}_name`] && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors[`allowance_${index}_name`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`allowance_${index}_amount`}>
                      Amount (₦)
                    </Label>
                    <Input
                      id={`allowance_${index}_amount`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={allowance.amount}
                      onChange={(e) =>
                        updateAllowance(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={
                        errors[`allowance_${index}_amount`]
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors[`allowance_${index}_amount`] && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors[`allowance_${index}_amount`]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`allowance_${index}_recurring`}
                        checked={allowance.isRecurring}
                        onCheckedChange={(checked) =>
                          updateAllowance(index, "isRecurring", checked)
                        }
                      />
                      <Label
                        htmlFor={`allowance_${index}_recurring`}
                        className="text-sm"
                      >
                        Recurring
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAllowance(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {allowances.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <Plus className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No allowances added yet</p>
                <p className="text-sm">
                  Click &quot;Add Allowance&quot; to add monthly allowances
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Banking Details */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Hash className="h-4 w-4" />
            Banking Details
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="e.g., First Bank of Nigeria"
                className={errors.bankName ? "border-red-500" : ""}
              />
              {errors.bankName && (
                <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange("accountNumber", e.target.value)
                }
                placeholder="10-digit account number"
                maxLength={10}
                className={errors.accountNumber ? "border-red-500" : ""}
              />
              {errors.accountNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.accountNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 border-t pt-6">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading
              ? "Saving..."
              : staff
                ? "Update Staff Member"
                : "Add Staff Member"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
