"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { depreciationPostingService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";

export default function DepreciationPostingPage() {
  const { appUser } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth.toString().padStart(2, "0"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    totalDepreciation: number;
    assetsProcessed: number;
    entriesCreated: number;
    errors: { assetCode: string; error: string }[];
  } | null>(null);

  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - 2 + i).toString(),
  );
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handlePostDepreciation = async () => {
    if (!appUser) return;

    try {
      setLoading(true);
      setResult(null);

      const depreciationResult =
        await depreciationPostingService.postMonthlyDepreciation(
          year,
          month,
          appUser.id,
        );

      setResult(depreciationResult);
    } catch (error) {
      console.error("Error posting depreciation:", error);
      setResult({
        totalDepreciation: 0,
        assetsProcessed: 0,
        entriesCreated: 0,
        errors: [
          {
            assetCode: "GENERAL",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Monthly Depreciation Posting
        </h1>
        <p className="mt-2 text-gray-600">
          Calculate and post depreciation for all active fixed assets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Depreciation
          </CardTitle>
          <CardDescription>
            Select the month and year to calculate and post depreciation entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will calculate depreciation for all active assets and create
              journal entries. Make sure the selected period is correct before
              proceeding.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handlePostDepreciation}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : "Post Depreciation"}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              {result.errors.length === 0 ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Depreciation posted successfully!</strong>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Completed with errors</strong>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b py-2">
                    <span className="text-gray-600">
                      Total Depreciation Amount:
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(result.totalDepreciation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b py-2">
                    <span className="text-gray-600">Assets Processed:</span>
                    <span className="font-semibold">
                      {result.assetsProcessed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b py-2">
                    <span className="text-gray-600">Entries Created:</span>
                    <span className="font-semibold">
                      {result.entriesCreated}
                    </span>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="pt-2">
                      <p className="mb-2 text-sm font-medium text-red-600">
                        Errors:
                      </p>
                      <ul className="space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx} className="text-sm text-red-600">
                            <strong>{err.assetCode}:</strong> {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>
              The system fetches all active fixed assets with depreciation
              enabled
            </li>
            <li>
              Monthly depreciation is calculated using the straight-line method
              based on depreciation rate or useful life
            </li>
            <li>
              Asset accumulated depreciation and current value are updated
            </li>
            <li>A depreciation entry record is created for tracking</li>
            <li>
              Journal entries are automatically posted:
              <ul className="mt-1 ml-6 list-inside list-disc">
                <li>Dr. Depreciation Expense</li>
                <li>Cr. Accumulated Depreciation</li>
              </ul>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
