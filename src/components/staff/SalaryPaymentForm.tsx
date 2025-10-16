'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Banknote, 
  Calculator, 
  Calendar, 
  User, 
  AlertTriangle,
  DollarSign,
  Minus,
  Building2
} from 'lucide-react';
import { staffService, salaryPaymentService } from '@/services/staffService';
import type { StaffMember, SalaryPayment, PaymentAllowance, PaymentDeduction } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SalaryPaymentFormProps {
  staffId?: string;
  paymentData?: SalaryPayment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface AllowanceForm {
  name: string;
  amount: number;
}

interface DeductionForm {
  name: string;
  amount: number;
}

export default function SalaryPaymentForm({ staffId, paymentData, onSuccess, onCancel }: SalaryPaymentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  
  // Current month and year
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear());

  // Form state
  const [formData, setFormData] = useState({
    staffId: staffId || paymentData?.staffId || '',
    month: paymentData?.month || currentMonth,
    year: paymentData?.year || currentYear,
    paymentMethod: (paymentData?.paymentMethod as 'bank_transfer' | 'cash' | 'cheque') || 'bank_transfer',
    paymentDate: paymentData?.paymentDate || currentDate.toISOString().split('T')[0],
  });
  
  const [allowances, setAllowances] = useState<AllowanceForm[]>(
    paymentData?.allowances || []
  );
  
  const [deductions, setDeductions] = useState<DeductionForm[]>(
    paymentData?.deductions || []
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (formData.staffId) {
      loadSelectedStaffData();
    }
  }, [formData.staffId]);

  useEffect(() => {
    // Auto-populate allowances from staff data
    if (selectedStaff && selectedStaff.allowances && allowances.length === 0) {
      setAllowances(
        selectedStaff.allowances.map(a => ({
          name: a.name,
          amount: a.amount
        }))
      );
    }
  }, [selectedStaff]);

  const loadStaff = async () => {
    try {
      const staffData = await staffService.getActiveStaff();
      setAllStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    }
  };

  const loadSelectedStaffData = async () => {
    if (!formData.staffId) return;
    
    setStaffLoading(true);
    try {
      const staff = await staffService.getById(formData.staffId);
      if (staff) {
        setSelectedStaff(staff);
        
        // Check if staff has been paid for this month
        const hasBeenPaid = await salaryPaymentService.hasBeenPaid(
          formData.staffId, 
          formData.month, 
          formData.year
        );
        
        if (hasBeenPaid && !paymentData) {
          toast({
            title: "Already Paid",
            description: `${staff.firstname} ${staff.surname} has already been paid for ${formData.month}/${formData.year}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff details",
        variant: "destructive",
      });
    } finally {
      setStaffLoading(false);
    }
  };

  const calculateSalaryBreakdown = () => {
    if (!selectedStaff) return { totalGross: 0, totalDeductions: 0, netPay: 0 };
    
    const basicSalary = selectedStaff.basicSalary;
    const totalAllowances = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalGross = basicSalary + totalAllowances;
    const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    const netPay = totalGross - totalDeductions;
    
    return { totalGross, totalDeductions, netPay };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const { netPay } = calculateSalaryBreakdown();

    // Required fields
    if (!formData.staffId) newErrors.staffId = 'Staff member is required';
    if (!formData.month) newErrors.month = 'Month is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';

    // Month validation
    const month = parseInt(formData.month);
    if (month < 1 || month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }

    // Year validation
    const year = parseInt(formData.year);
    if (year < 2020 || year > 2050) {
      newErrors.year = 'Year must be between 2020 and 2050';
    }

    // Payment method validation
    if (formData.paymentMethod === 'cash' && netPay > 100000) {
      newErrors.paymentMethod = 'Cash payments cannot exceed ₦100,000';
    }

    if (netPay > 500000 && formData.paymentMethod !== 'bank_transfer') {
      newErrors.paymentMethod = 'Salary payments over ₦500,000 must use bank transfer';
    }

    // Net pay validation
    if (netPay < 0) {
      newErrors.general = 'Net pay cannot be negative (deductions exceed gross pay)';
    }

    if (netPay > 15000000) {
      newErrors.general = 'Net pay cannot exceed ₦15,000,000 (sanity check)';
    }

    // Allowances validation
    allowances.forEach((allowance, index) => {
      if (!allowance.name.trim()) {
        newErrors[`allowance_${index}_name`] = 'Allowance name is required';
      }
      if (allowance.amount <= 0) {
        newErrors[`allowance_${index}_amount`] = 'Allowance amount must be greater than 0';
      }
    });

    // Deductions validation
    deductions.forEach((deduction, index) => {
      if (!deduction.name.trim()) {
        newErrors[`deduction_${index}_name`] = 'Deduction name is required';
      }
      if (deduction.amount <= 0) {
        newErrors[`deduction_${index}_amount`] = 'Deduction amount must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addAllowance = () => {
    if (allowances.length >= 20) {
      toast({
        title: "Limit Reached",
        description: "Cannot add more than 20 allowances per salary payment",
        variant: "destructive",
      });
      return;
    }
    setAllowances(prev => [...prev, { name: '', amount: 0 }]);
  };

  const removeAllowance = (index: number) => {
    setAllowances(prev => prev.filter((_, i) => i !== index));
  };

  const updateAllowance = (index: number, field: keyof AllowanceForm, value: string | number) => {
    setAllowances(prev => prev.map((allowance, i) => 
      i === index ? { ...allowance, [field]: value } : allowance
    ));
  };

  const addDeduction = () => {
    if (deductions.length >= 20) {
      toast({
        title: "Limit Reached",
        description: "Cannot add more than 20 deductions per salary payment",
        variant: "destructive",
      });
      return;
    }
    setDeductions(prev => [...prev, { name: '', amount: 0 }]);
  };

  const removeDeduction = (index: number) => {
    setDeductions(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeduction = (index: number, field: keyof DeductionForm, value: string | number) => {
    setDeductions(prev => prev.map((deduction, i) => 
      i === index ? { ...deduction, [field]: value } : deduction
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedStaff) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const paymentPayload = {
        staffId: selectedStaff.id,
        staffName: `${selectedStaff.firstname} ${selectedStaff.surname}`,
        staffNumber: selectedStaff.staffNumber,
        month: formData.month,
        year: formData.year,
        basicSalary: selectedStaff.basicSalary,
        allowances: allowances as PaymentAllowance[],
        deductions: deductions as PaymentDeduction[],
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        recordedBy: 'current-user', // Replace with actual user ID
      };

      if (paymentData) {
        // Update existing payment (not typically done)
        await salaryPaymentService.update(paymentData.id, paymentPayload);
        toast({
          title: "Salary Payment Updated",
          description: `Salary payment for ${selectedStaff.firstname} ${selectedStaff.surname} has been updated`,
        });
      } else {
        // Create new payment
        await salaryPaymentService.processSalaryPayment(paymentPayload);
        toast({
          title: "Salary Payment Processed",
          description: `Salary payment for ${selectedStaff.firstname} ${selectedStaff.surname} has been processed successfully`,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error processing salary payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process salary payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { totalGross, totalDeductions, netPay } = calculateSalaryBreakdown();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            {paymentData ? 'Edit Salary Payment' : 'Process Salary Payment'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="staffId">Staff Member *</Label>
                  <Select value={formData.staffId} onValueChange={(value) => handleInputChange('staffId', value)}>
                    <SelectTrigger className={errors.staffId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {allStaff.map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.firstname} {staff.surname} - {staff.staffNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.staffId && <p className="text-sm text-red-500 mt-1">{errors.staffId}</p>}
                </div>
                
                <div>
                  <Label htmlFor="month">Month *</Label>
                  <Select value={formData.month} onValueChange={(value) => handleInputChange('month', value)}>
                    <SelectTrigger className={errors.month ? 'border-red-500' : ''}>
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
                  {errors.month && <p className="text-sm text-red-500 mt-1">{errors.month}</p>}
                </div>
                
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                    <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year}</p>}
                </div>
                
                <div>
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                    className={errors.paymentDate ? 'border-red-500' : ''}
                  />
                  {errors.paymentDate && <p className="text-sm text-red-500 mt-1">{errors.paymentDate}</p>}
                </div>
              </div>
            </div>

            {/* Staff Information Display */}
            {selectedStaff && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {selectedStaff.firstname.charAt(0)}{selectedStaff.surname.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {selectedStaff.firstname} {selectedStaff.surname}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {selectedStaff.position}
                          {selectedStaff.department && ` • ${selectedStaff.department}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Basic: {formatCurrency(selectedStaff.basicSalary)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Staff No: {selectedStaff.staffNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedStaff && (
              <>
                {/* Salary Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Salary Breakdown
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Allowances */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center gap-2">
                          <Plus className="w-4 h-4 text-green-600" />
                          Allowances
                        </h4>
                        <Button type="button" onClick={addAllowance} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
                          <span className="font-medium">Basic Salary</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(selectedStaff.basicSalary)}
                          </span>
                        </div>
                        
                        {allowances.map((allowance, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`allowance_${index}_name`}>Name</Label>
                                <Input
                                  id={`allowance_${index}_name`}
                                  value={allowance.name}
                                  onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                                  placeholder="e.g., Transport Allowance"
                                  className={errors[`allowance_${index}_name`] ? 'border-red-500' : ''}
                                />
                                {errors[`allowance_${index}_name`] && (
                                  <p className="text-sm text-red-500 mt-1">{errors[`allowance_${index}_name`]}</p>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label htmlFor={`allowance_${index}_amount`}>Amount (₦)</Label>
                                  <Input
                                    id={`allowance_${index}_amount`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={allowance.amount}
                                    onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value) || 0)}
                                    className={errors[`allowance_${index}_amount`] ? 'border-red-500' : ''}
                                  />
                                  {errors[`allowance_${index}_amount`] && (
                                    <p className="text-sm text-red-500 mt-1">{errors[`allowance_${index}_amount`]}</p>
                                  )}
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeAllowance(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {allowances.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Plus className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No additional allowances</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold flex items-center gap-2">
                          <Minus className="w-4 h-4 text-red-600" />
                          Deductions
                        </h4>
                        <Button type="button" onClick={addDeduction} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {deductions.map((deduction, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`deduction_${index}_name`}>Name</Label>
                                <Input
                                  id={`deduction_${index}_name`}
                                  value={deduction.name}
                                  onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                                  placeholder="e.g., Tax, Pension"
                                  className={errors[`deduction_${index}_name`] ? 'border-red-500' : ''}
                                />
                                {errors[`deduction_${index}_name`] && (
                                  <p className="text-sm text-red-500 mt-1">{errors[`deduction_${index}_name`]}</p>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label htmlFor={`deduction_${index}_amount`}>Amount (₦)</Label>
                                  <Input
                                    id={`deduction_${index}_amount`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={deduction.amount}
                                    onChange={(e) => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                                    className={errors[`deduction_${index}_amount`] ? 'border-red-500' : ''}
                                  />
                                  {errors[`deduction_${index}_amount`] && (
                                    <p className="text-sm text-red-500 mt-1">{errors[`deduction_${index}_amount`]}</p>
                                  )}
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeDeduction(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {deductions.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Minus className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No deductions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-medium">{formatCurrency(selectedStaff.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Allowances:</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(allowances.reduce((sum, a) => sum + (a.amount || 0), 0))}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Gross Pay:</span>
                        <span>{formatCurrency(totalGross)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(totalDeductions)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Pay:</span>
                        <span className={netPay < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(netPay)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select 
                        value={formData.paymentMethod} 
                        onValueChange={(value) => handleInputChange('paymentMethod', value)}
                      >
                        <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.paymentMethod && <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>}
                    </div>

                    <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Payment Period</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {monthNames[parseInt(formData.month) - 1]} {formData.year}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" disabled={loading || !selectedStaff} className="flex-1">
                {loading ? 'Processing...' : paymentData ? 'Update Payment' : 'Process Salary Payment'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}