'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Banknote, 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Receipt,
  Calculator,
  AlertTriangle,
  Building2,
  Phone
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { staffService, salaryPaymentService } from '@/services/staffService';
import type { StaffMember, SalaryPayment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import SalaryPaymentForm from './SalaryPaymentForm';

interface PayrollStats {
  totalStaff: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  pendingPayments: number;
  approvedPayments: number;
  paidPayments: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}

export default function PayrollDashboard() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SalaryPayment[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  // Current month and year
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear());

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, paymentsData, statsData] = await Promise.all([
        staffService.getActiveStaff(),
        salaryPaymentService.getByMonthAndYear(selectedMonth, selectedYear),
        salaryPaymentService.getPayrollSummary(selectedMonth, selectedYear),
      ]);
      
      setStaff(staffData);
      setPayments(paymentsData);
      setPayrollStats(statsData);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.staffName.toLowerCase().includes(term) ||
        p.staffNumber.toLowerCase().includes(term) ||
        p.reference.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleProcessPayment = (staffId?: string) => {
    setSelectedPayment(null);
    setSelectedStaffId(staffId || '');
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setSelectedStaffId(payment.staffId);
    setShowPaymentForm(true);
  };

  const handleViewPayment = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const handleApprovePayment = async (payment: SalaryPayment) => {
    try {
      await salaryPaymentService.approveSalaryPayment(payment.id, 'current-admin');
      toast({
        title: "Payment Approved",
        description: `Salary payment for ${payment.staffName} has been approved`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (payment: SalaryPayment) => {
    try {
      await salaryPaymentService.markAsPaid(payment.id);
      toast({
        title: "Payment Completed",
        description: `Salary payment for ${payment.staffName} has been marked as paid`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment as paid",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPayment(null);
    setSelectedStaffId('');
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: SalaryPayment['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SalaryPayment['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'paid': return <Banknote className="w-3 h-3" />;
      default: return <XCircle className="w-3 h-3" />;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const unprocessedStaff = staff.filter(s => 
    !payments.some(p => p.staffId === s.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-600">
            Manage salary payments for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleProcessPayment()} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Process Salary
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Payroll Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={String(index + 1).padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                Load Payroll
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {payrollStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{payrollStats.totalStaff}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gross</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payrollStats.totalGross)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Net Pay</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(payrollStats.totalNetPay)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Banknote className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Payments</p>
                  <p className="text-2xl font-bold text-orange-600">{payrollStats.paidPayments}</p>
                  <p className="text-xs text-gray-500">
                    {payrollStats.pendingPayments} pending, {payrollStats.approvedPayments} approved
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Salary Payments</TabsTrigger>
          <TabsTrigger value="unprocessed">Unprocessed Staff</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {payment.staffName.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">
                              {payment.staffName}
                            </h3>
                            <Badge 
                              className={getStatusColor(payment.status)}
                              variant="secondary"
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(payment.status)}
                                {payment.status}
                              </span>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Staff No: {payment.staffNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Gross: {formatCurrency(payment.totalGross)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Banknote className="w-3 h-3" />
                              Net: {formatCurrency(payment.netPay)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {payment.reference}
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewPayment(payment)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Payment
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          {payment.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleApprovePayment(payment)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Payment
                            </DropdownMenuItem>
                          )}
                          
                          {payment.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(payment)}>
                              <Banknote className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem>
                            <Receipt className="w-4 h-4 mr-2" />
                            Generate Payslip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12">
                    <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No salary payments found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all'
                        ? "No payments match your current filters"
                        : `No salary payments have been processed for ${monthNames[parseInt(selectedMonth) - 1]} ${selectedYear}`
                      }
                    </p>
                    {!(searchTerm || statusFilter !== 'all') && (
                      <Button onClick={() => handleProcessPayment()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Process First Salary Payment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unprocessed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unprocessed Staff ({unprocessedStaff.length})</CardTitle>
              <p className="text-sm text-gray-600">
                Staff members who haven&apos;t received salary for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unprocessedStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {staffMember.firstname.charAt(0)}{staffMember.surname.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">
                            {staffMember.firstname} {staffMember.surname}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {staffMember.position}
                              {staffMember.department && ` • ${staffMember.department}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {staffMember.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(staffService.calculateTotalCompensation(staffMember))}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Staff No: {staffMember.staffNumber}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleProcessPayment(staffMember.id)}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Process Salary
                      </Button>
                    </div>
                  </div>
                ))}

                {unprocessedStaff.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Staff Processed!</h3>
                    <p className="text-gray-600">
                      All active staff members have salary payments for {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {payrollStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Method Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(payrollStats.byPaymentMethod).map(([method, data]) => {
                      const percentage = payrollStats.totalStaff > 0 ? (data.count / payrollStats.totalStaff) * 100 : 0;
                      return (
                        <div key={method} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="capitalize">{method.replace('_', ' ')}</span>
                            <span>{data.count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: {formatCurrency(data.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Pending</span>
                      </div>
                      <span className="font-semibold">{payrollStats.pendingPayments}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Approved</span>
                      </div>
                      <span className="font-semibold">{payrollStats.approvedPayments}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-green-600" />
                        <span>Paid</span>
                      </div>
                      <span className="font-semibold">{payrollStats.paidPayments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Gross Pay</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(payrollStats.totalGross)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(payrollStats.totalDeductions)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Net Pay</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(payrollStats.totalNetPay)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Salary Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? 'Edit Salary Payment' : 'Process Salary Payment'}
            </DialogTitle>
          </DialogHeader>
          <SalaryPaymentForm
            staffId={selectedStaffId}
            paymentData={selectedPayment}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowPaymentForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Salary Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Staff Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {selectedPayment.staffName.split(' ').map(n => n.charAt(0)).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPayment.staffName}</h2>
                  <p className="text-gray-600">Staff No: {selectedPayment.staffNumber}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(selectedPayment.status)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedPayment.status)}
                        {selectedPayment.status}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span>{selectedPayment.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span>{monthNames[parseInt(selectedPayment.month) - 1]} {selectedPayment.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span>{new Date(selectedPayment.paymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Financial Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-semibold">{formatCurrency(selectedPayment.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Gross:</span>
                      <span className="font-semibold">{formatCurrency(selectedPayment.totalGross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deductions:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(selectedPayment.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-semibold">Net Pay:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedPayment.netPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allowances */}
              {selectedPayment.allowances && selectedPayment.allowances.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Allowances</h3>
                  <div className="space-y-2">
                    {selectedPayment.allowances.map((allowance, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span>{allowance.name}</span>
                        <span className="font-semibold text-green-600">+{formatCurrency(allowance.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions */}
              {selectedPayment.deductions && selectedPayment.deductions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Deductions</h3>
                  <div className="space-y-2">
                    {selectedPayment.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span>{deduction.name}</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(deduction.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}