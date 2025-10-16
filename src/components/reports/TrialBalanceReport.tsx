'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TrialBalanceReportProps {
  filters: {
    asOfDate: string;
    format: 'monthly' | 'quarterly' | 'yearly';
  };
  onBack: () => void;
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({ onBack }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Trial Balance</h1>
      </div>
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Trial Balance Report coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialBalanceReport;