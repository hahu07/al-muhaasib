"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  accountMappingService,
  chartOfAccountsService,
} from "@/services";
import type { AccountMapping, ChartOfAccounts } from "@/types";

const AccountMappingManager: React.FC = () => {
  const [revenueMappings, setRevenueMappings] = useState<AccountMapping[]>([]);
  const [expenseMappings, setExpenseMappings] = useState<AccountMapping[]>([]);
  const [assetMappings, setAssetMappings] = useState<AccountMapping[]>([]);
  const [liabilityMappings, setLiabilityMappings] = useState<AccountMapping[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<ChartOfAccounts[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccounts[]>([]);
  const [assetAccounts, setAssetAccounts] = useState<ChartOfAccounts[]>([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState<ChartOfAccounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Track changes
  const [changes, setChanges] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Load accounts
      const accounts = await chartOfAccountsService.getActiveAccounts();
      setRevenueAccounts(accounts.filter((a) => a.accountType === "revenue"));
      setExpenseAccounts(accounts.filter((a) => a.accountType === "expense"));
      setAssetAccounts(accounts.filter((a) => a.accountType === "asset"));
      setLiabilityAccounts(accounts.filter((a) => a.accountType === "liability"));

      // Load mappings
      const revenue = await accountMappingService.getByType("revenue");
      const expense = await accountMappingService.getByType("expense");
      const asset = await accountMappingService.getByType("asset");
      const liability = await accountMappingService.getByType("liability");

      // Initialize default mappings if none exist
      if (
        revenue.length === 0 ||
        expense.length === 0 ||
        asset.length === 0 ||
        liability.length === 0
      ) {
        await accountMappingService.initializeDefaults();
        const newRevenue = await accountMappingService.getByType("revenue");
        const newExpense = await accountMappingService.getByType("expense");
        const newAsset = await accountMappingService.getByType("asset");
        const newLiability = await accountMappingService.getByType("liability");
        setRevenueMappings(newRevenue);
        setExpenseMappings(newExpense);
        setAssetMappings(newAsset);
        setLiabilityMappings(newLiability);
      } else {
        setRevenueMappings(revenue);
        setExpenseMappings(expense);
        setAssetMappings(asset);
        setLiabilityMappings(liability);
      }
    } catch (error) {
      console.error("Failed to load account mappings:", error);
      setMessage({
        type: "error",
        text: "Failed to load account mappings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (mappingId: string, accountId: string, accounts: ChartOfAccounts[]) => {
    const account = accounts.find((a) => a.id === accountId);
    if (account) {
      changes.set(mappingId, account.id);
      setChanges(new Map(changes));
    }
  };

  const getAccountDisplay = (accountId: string, accounts: ChartOfAccounts[]): string => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.accountCode} - ${account.accountName}` : accountId;
  };

  const cleanupDuplicates = async () => {
    try {
      setCleaning(true);
      setMessage(null);

      const deletedCount = await accountMappingService.removeDuplicates();
      
      if (deletedCount > 0) {
        await loadData();
        setMessage({
          type: "success",
          text: `Removed ${deletedCount} duplicate mapping(s)`,
        });
      } else {
        setMessage({
          type: "success",
          text: "No duplicates found",
        });
      }
    } catch (error) {
      console.error("Failed to cleanup duplicates:", error);
      setMessage({
        type: "error",
        text: "Failed to cleanup duplicates",
      });
    } finally {
      setCleaning(false);
    }
  };

  const saveChanges = async () => {
    if (changes.size === 0) {
      setMessage({ type: "error", text: "No changes to save" });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const allMappings = [
        ...revenueMappings,
        ...expenseMappings,
        ...assetMappings,
        ...liabilityMappings,
      ];

      for (const [mappingId, accountId] of changes.entries()) {
        const mapping = allMappings.find((m) => m.id === mappingId);
        if (!mapping) continue;

        const allAccounts = [
          ...revenueAccounts,
          ...expenseAccounts,
          ...assetAccounts,
          ...liabilityAccounts,
        ];
        const account = allAccounts.find((a) => a.id === accountId);
        if (!account) continue;

        await accountMappingService.setMapping({
          mappingType: mapping.mappingType,
          sourceType: mapping.sourceType,
          sourceName: mapping.sourceName,
          accountId: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
        });
      }

      setChanges(new Map());
      await loadData();
      setMessage({
        type: "success",
        text: `Successfully updated ${changes.size} mapping(s)`,
      });
    } catch (error) {
      console.error("Failed to save mappings:", error);
      setMessage({
        type: "error",
        text: "Failed to save mappings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading account mappings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Mappings</h2>
          <p className="text-gray-600">
            Configure which GL accounts are used for different transaction types
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cleanupDuplicates}
            disabled={loading || saving || cleaning}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {cleaning ? "Cleaning..." : "Cleanup Duplicates"}
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading || saving || cleaning}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={saveChanges}
            disabled={changes.size === 0 || saving || cleaning}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes {changes.size > 0 && `(${changes.size})`}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Card className={message.type === "success" ? "border-green-500" : "border-red-500"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Mappings (Fee Types)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{mapping.sourceName}</div>
                  <div className="text-sm text-gray-500">
                    Type: {mapping.sourceType}
                    {mapping.isDefault && (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-80">
                  <Select
                    value={changes.get(mapping.id) || mapping.accountId}
                    onValueChange={(value) =>
                      handleAccountChange(mapping.id, value, revenueAccounts)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span className="truncate">
                        {getAccountDisplay(
                          changes.get(mapping.id) || mapping.accountId,
                          revenueAccounts
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {revenueAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Mappings (Expense Categories)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{mapping.sourceName}</div>
                  <div className="text-sm text-gray-500">
                    Type: {mapping.sourceType}
                    {mapping.isDefault && (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-80">
                  <Select
                    value={changes.get(mapping.id) || mapping.accountId}
                    onValueChange={(value) =>
                      handleAccountChange(mapping.id, value, expenseAccounts)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span className="truncate">
                        {getAccountDisplay(
                          changes.get(mapping.id) || mapping.accountId,
                          expenseAccounts
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Asset Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Mappings (Asset Acquisition Types)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assetMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{mapping.sourceName}</div>
                  <div className="text-sm text-gray-500">
                    Type: {mapping.sourceType}
                    {mapping.isDefault && (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-80">
                  <Select
                    value={changes.get(mapping.id) || mapping.accountId}
                    onValueChange={(value) =>
                      handleAccountChange(mapping.id, value, assetAccounts)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span className="truncate">
                        {getAccountDisplay(
                          changes.get(mapping.id) || mapping.accountId,
                          assetAccounts
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {assetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liability Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Liability Mappings (Liability Types)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {liabilityMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium">{mapping.sourceName}</div>
                  <div className="text-sm text-gray-500">
                    Type: {mapping.sourceType}
                    {mapping.isDefault && (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-80">
                  <Select
                    value={changes.get(mapping.id) || mapping.accountId}
                    onValueChange={(value) =>
                      handleAccountChange(mapping.id, value, liabilityAccounts)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span className="truncate">
                        {getAccountDisplay(
                          changes.get(mapping.id) || mapping.accountId,
                          liabilityAccounts
                        )}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {liabilityAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountMappingManager;
