"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, AlertCircle, Plus, X } from "lucide-react";
import { schoolConfigService } from "@/services/schoolConfigService";
import { bankAccountService } from "@/services/accountingService";
import type { BankAccount, SchoolConfig } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface BankAccountSettingsProps {
  config: SchoolConfig;
  onUpdate: () => void;
}

// Predefined common transaction types
const COMMON_TRANSACTION_TYPES = [
  { id: "feePayments", label: "Fee Payments", description: "Student fee payments" },
  { id: "expenses", label: "Expenses", description: "Operational expenses" },
  { id: "salaries", label: "Salaries", description: "Staff salary payments" },
];

export const BankAccountSettings: React.FC<BankAccountSettingsProps> = ({
  config,
  onUpdate,
}) => {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountMappings, setAccountMappings] = useState<Record<string, string>>({});

  // Helper function to get bank account display name
  const getBankAccountDisplay = (accountId: string): string => {
    if (!accountId) return "None (use first active)";
    const account = bankAccounts.find((a) => a.id === accountId);
    if (!account) return "None (use first active)";
    return `${account.bankName} - ${account.accountName} (${account.accountNumber})`;
  };
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState({
    id: "",
    label: "",
    description: "",
  });
  const [customTypes, setCustomTypes] = useState<Array<{ id: string; label: string; description: string }>>([]);
  const [newAccount, setNewAccount] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    accountType: "current" as "current" | "savings",
  });

  useEffect(() => {
    loadBankAccounts();
    // Load current configuration
    const mappings = config.defaultBankAccounts || {};
    console.log("Account mappings from config:", mappings);
    setAccountMappings(mappings);
    
    // Extract custom types (those not in COMMON_TRANSACTION_TYPES)
    const customTypesList = Object.keys(mappings)
      .filter(key => !COMMON_TRANSACTION_TYPES.some(t => t.id === key))
      .map(key => ({
        id: key,
        label: key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase()),
        description: `Custom transaction type: ${key}`,
      }));
    setCustomTypes(customTypesList);
  }, [config]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await bankAccountService.list();
      const activeAccounts = accounts.filter((acc) => acc.isActive);
      console.log("Loaded bank accounts:", activeAccounts);
      setBankAccounts(activeAccounts);
    } catch (err) {
      console.error("Error loading bank accounts:", err);
      setError("Failed to load bank accounts");
    }
  };

  const handleAddAccount = async () => {
    if (!appUser) {
      setError("You must be logged in to add a bank account");
      return;
    }

    if (
      !newAccount.bankName ||
      !newAccount.accountName ||
      !newAccount.accountNumber
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await bankAccountService.create({
        bankName: newAccount.bankName,
        accountName: newAccount.accountName,
        accountNumber: newAccount.accountNumber,
        accountType: newAccount.accountType,
        balance: 0,
        isActive: true,
      });

      // Reset form
      setNewAccount({
        bankName: "",
        accountName: "",
        accountNumber: "",
        accountType: "current",
      });
      setShowAddForm(false);

      // Reload accounts
      await loadBankAccounts();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error adding bank account:", err);
      setError(
        err instanceof Error ? err.message : "Failed to add bank account"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransactionType = () => {
    if (!newTransactionType.id || !newTransactionType.label) {
      setError("Please provide both ID and label for the transaction type");
      return;
    }

    // Convert to camelCase
    const typeId = newTransactionType.id
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());

    // Check for duplicates
    const allTypes = [...COMMON_TRANSACTION_TYPES, ...customTypes];
    if (allTypes.some(t => t.id === typeId)) {
      setError("A transaction type with this ID already exists");
      return;
    }

    const newType = {
      id: typeId,
      label: newTransactionType.label,
      description: newTransactionType.description || `Custom: ${newTransactionType.label}`,
    };

    setCustomTypes([...customTypes, newType]);
    setAccountMappings({ ...accountMappings, [typeId]: "" });
    setNewTransactionType({ id: "", label: "", description: "" });
    setShowAddTypeForm(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleRemoveTransactionType = (typeId: string) => {
    setCustomTypes(customTypes.filter(t => t.id !== typeId));
    const newMappings = { ...accountMappings };
    delete newMappings[typeId];
    setAccountMappings(newMappings);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Filter out empty values
      const cleanedMappings = Object.fromEntries(
        Object.entries(accountMappings).filter(([_, value]) => value)
      );

      await schoolConfigService.updateDefaultBankAccounts(config.id, cleanedMappings);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUpdate();
    } catch (err) {
      console.error("Error updating bank account settings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Default Bank Accounts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure which bank accounts to use for automatic transaction
            posting. If not configured, the system will use the first active
            bank account.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm">
            Settings updated successfully!
          </div>
        )}

        {/* Add New Account Button */}
        {!showAddForm && (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Add New Bank Account
          </Button>
        )}

        {/* Add New Account Form */}
        {showAddForm && (
          <Card className="p-4 border-2 border-blue-500">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Add New Bank Account</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    value={newAccount.bankName}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, bankName: e.target.value })
                    }
                    placeholder="e.g., GTBank, Access Bank"
                  />
                </div>

                <div>
                  <Label>Account Name *</Label>
                  <Input
                    value={newAccount.accountName}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountName: e.target.value,
                      })
                    }
                    placeholder="School account name"
                  />
                </div>

                <div>
                  <Label>Account Number *</Label>
                  <Input
                    value={newAccount.accountNumber}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="10-digit account number"
                  />
                </div>

                <div>
                  <Label>Account Type</Label>
                  <Select
                    value={newAccount.accountType}
                    onValueChange={(value: "current" | "savings") =>
                      setNewAccount({ ...newAccount, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAccount} disabled={loading}>
                  {loading ? "Adding..." : "Add Account"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Add New Transaction Type Button */}
        {bankAccounts.length > 0 && !showAddTypeForm && (
          <Button
            variant="outline"
            onClick={() => setShowAddTypeForm(true)}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            Add Custom Transaction Type
          </Button>
        )}

        {/* Add New Transaction Type Form */}
        {showAddTypeForm && (
          <Card className="p-4 border-2 border-green-500">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Add Custom Transaction Type</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddTypeForm(false);
                    setError(null);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Type ID *</Label>
                  <Input
                    value={newTransactionType.id}
                    onChange={(e) =>
                      setNewTransactionType({ ...newTransactionType, id: e.target.value })
                    }
                    placeholder="e.g., contributions, donations"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use lowercase, no spaces (will be converted to camelCase)
                  </p>
                </div>

                <div>
                  <Label>Display Label *</Label>
                  <Input
                    value={newTransactionType.label}
                    onChange={(e) =>
                      setNewTransactionType({ ...newTransactionType, label: e.target.value })
                    }
                    placeholder="e.g., Contributions, Donations"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={newTransactionType.description}
                    onChange={(e) =>
                      setNewTransactionType({ ...newTransactionType, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTypeForm(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddTransactionType}>
                  Add Type
                </Button>
              </div>
            </div>
          </Card>
        )}

        {bankAccounts.length === 0 && !showAddForm ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No bank accounts found. Click above to add one.</p>
          </div>
        ) : bankAccounts.length > 0 ? (
          <div className="space-y-4">
            {/* Render all transaction types dynamically */}
            {[...COMMON_TRANSACTION_TYPES, ...customTypes].map((type) => (
              <div key={type.id} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    {type.label}
                  </label>
                  {/* Show remove button for custom types */}
                  {!COMMON_TRANSACTION_TYPES.some(t => t.id === type.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTransactionType(type.id)}
                      className="h-6 px-2"
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={accountMappings[type.id] || ""}
                    onChange={(e) =>
                      setAccountMappings({ ...accountMappings, [type.id]: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">None (use first active)</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountName} ({account.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {bankAccounts.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            <Save size={16} className="mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
        )}
      </div>
    </Card>
  );
};
