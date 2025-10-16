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
import {
  Search, 
  Plus, 
  Users, 
  Banknote, 
  Edit,
  Eye,
  MoreHorizontal,
  Filter,
  Download,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { staffService } from '@/services/staffService';
import type { StaffMember } from '@/types';
import { useToast } from '@/hooks/use-toast';
import StaffForm from './StaffForm';

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  byEmploymentType: Record<string, number>;
  byDepartment: Record<string, number>;
  totalMonthlySalaries: number;
}

export default function StaffDashboard() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [staff, searchTerm, statusFilter, employmentTypeFilter, departmentFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, statsData] = await Promise.all([
        staffService.list(),
        staffService.getStaffSummary(),
      ]);
      
      setStaff(staffData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...staff];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.firstname.toLowerCase().includes(term) ||
        s.surname.toLowerCase().includes(term) ||
        s.staffNumber.toLowerCase().includes(term) ||
        s.position.toLowerCase().includes(term) ||
        s.phone.includes(term) ||
        (s.email && s.email.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => 
        statusFilter === 'active' ? s.isActive : !s.isActive
      );
    }

    // Employment type filter
    if (employmentTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.employmentType === employmentTypeFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(s => s.department === departmentFilter);
    }

    setFilteredStaff(filtered);
  };

  const handleAddStaff = () => {
    setSelectedStaff(null);
    setShowForm(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    console.log('handleEditStaff called for:', staff.firstname, staff.surname);
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleViewStaff = (staff: StaffMember) => {
    console.log('handleViewStaff called for:', staff.firstname, staff.surname);
    setSelectedStaff(staff);
    setShowDetails(true);
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    console.log('handleToggleStatus called for:', staff.firstname, staff.surname, 'isActive:', staff.isActive);
    try {
      if (staff.isActive) {
        await staffService.deactivateStaff(staff.id);
        toast({
          title: "Staff Deactivated",
          description: `${staff.firstname} ${staff.surname} has been deactivated`,
        });
      } else {
        await staffService.reactivateStaff(staff.id);
        toast({
          title: "Staff Reactivated",
          description: `${staff.firstname} ${staff.surname} has been reactivated`,
        });
      }
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedStaff(null);
    loadData();
  };

  const handleSeedSampleStaff = async () => {
    try {
      await staffService.seedSampleStaff();
      toast({
        title: "Sample Staff Added",
        description: "Sample staff members have been created successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sample staff",
        variant: "destructive",
      });
    }
  };

  const getUniqueValues = (key: keyof StaffMember) => {
    return Array.from(new Set(
      staff.map(s => s[key])
        .filter(Boolean)
        .map(v => String(v))
    )).sort();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getEmploymentTypeColor = (type: StaffMember['employmentType']) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-yellow-100 text-yellow-800';
      case 'contract': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your school&apos;s staff members and their information</p>
        </div>
        <Button onClick={handleAddStaff} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeStaff}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.totalMonthlySalaries)}
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
                  <p className="text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.keys(stats.byDepartment).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Staff List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search staff..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {getUniqueValues('department').map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
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

          {/* Staff List */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStaff.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {staffMember.firstname.charAt(0)}{staffMember.surname.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold">
                              {staffMember.firstname} {staffMember.surname}
                            </h3>
                            <Badge 
                              className={getEmploymentTypeColor(staffMember.employmentType)}
                              variant="secondary"
                            >
                              {staffMember.employmentType}
                            </Badge>
                            <Badge variant={staffMember.isActive ? "default" : "secondary"}>
                              {staffMember.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewStaff(staffMember)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditStaff(staffMember)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(staffMember)}>
                            {staffMember.isActive ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredStaff.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || employmentTypeFilter !== 'all' || departmentFilter !== 'all'
                        ? "No staff match your current filters"
                        : "Get started by adding your first staff member"
                      }
                    </p>
                    {!(searchTerm || statusFilter !== 'all' || employmentTypeFilter !== 'all' || departmentFilter !== 'all') && (
                      <div className="flex gap-3 justify-center">
                        <Button onClick={handleAddStaff}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Staff Member
                        </Button>
                        {staff.length === 0 && (
                          <Button onClick={handleSeedSampleStaff} variant="outline">
                            <Users className="w-4 h-4 mr-2" />
                            Add Sample Staff
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employment Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Employment Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.byEmploymentType).map(([type, count]) => {
                      const percentage = stats.totalStaff > 0 ? (count / stats.totalStaff) * 100 : 0;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="capitalize">{type.replace('-', ' ')}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.byDepartment).map(([dept, count]) => {
                      const percentage = stats.totalStaff > 0 ? (count / stats.totalStaff) * 100 : 0;
                      return (
                        <div key={dept} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{dept}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Salary Distribution */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Salary Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Monthly Payroll</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.totalMonthlySalaries)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Average Salary</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.activeStaff > 0 ? stats.totalMonthlySalaries / stats.activeStaff : 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Annual Payroll</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(stats.totalMonthlySalaries * 12)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Staff Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <StaffForm
              staff={selectedStaff}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Staff Details
            </DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
              <div className="space-y-6 py-4">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {selectedStaff.firstname.charAt(0)}{selectedStaff.surname.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {selectedStaff.firstname} {selectedStaff.surname}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">{selectedStaff.position}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${getEmploymentTypeColor(selectedStaff.employmentType)} text-sm px-3 py-1`}>
                          {selectedStaff.employmentType.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge 
                          variant={selectedStaff.isActive ? "default" : "secondary"}
                          className="text-sm px-3 py-1"
                        >
                          {selectedStaff.isActive ? "✅ Active" : "❌ Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Personal Information</h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow label="Staff Number" value={selectedStaff.staffNumber} />
                      <InfoRow label="Phone" value={selectedStaff.phone} />
                      {selectedStaff.email && <InfoRow label="Email" value={selectedStaff.email} />}
                      {selectedStaff.address && <InfoRow label="Address" value={selectedStaff.address} multiline />}
                    </div>
                  </div>

                  {/* Employment Details Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Employment Details</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedStaff.department && <InfoRow label="Department" value={selectedStaff.department} />}
                      <InfoRow 
                        label="Employment Date" 
                        value={new Date(selectedStaff.employmentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} 
                      />
                      <InfoRow 
                        label="Basic Salary" 
                        value={formatCurrency(selectedStaff.basicSalary)}
                        highlight
                      />
                      <InfoRow 
                        label="Total Compensation" 
                        value={formatCurrency(staffService.calculateTotalCompensation(selectedStaff))}
                        highlight
                        success
                      />
                    </div>
                  </div>
                </div>

                {/* Allowances Section */}
                {selectedStaff.allowances && selectedStaff.allowances.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Allowances</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedStaff.allowances.map((allowance, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{allowance.name}</span>
                            {allowance.isRecurring && (
                              <Badge variant="outline" className="ml-2 text-xs px-2 py-0">
                                🔄 Recurring
                              </Badge>
                            )}
                          </div>
                          <span className="font-bold text-lg text-green-600 dark:text-green-400">
                            {formatCurrency(allowance.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Banking Details */}
                {selectedStaff.bankName && selectedStaff.accountNumber && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Banking Details</h3>
                    </div>
                    <div className="space-y-3">
                      <InfoRow label="Bank Name" value={selectedStaff.bankName} />
                      <InfoRow label="Account Number" value={selectedStaff.accountNumber} />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => {
                      setShowDetails(false);
                      handleEditStaff(selectedStaff);
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Staff
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleToggleStatus(selectedStaff)}
                    className="flex-1 sm:flex-none"
                  >
                    {selectedStaff.isActive ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Reactivate
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDetails(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for displaying information rows
function InfoRow({ 
  label, 
  value, 
  multiline = false, 
  highlight = false, 
  success = false 
}: {
  label: string;
  value: string;
  multiline?: boolean;
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div className={`flex ${multiline ? 'flex-col' : 'justify-between items-center'} py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0`}>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}:
      </span>
      <span 
        className={`text-sm ${
          highlight 
            ? success 
              ? 'font-bold text-green-600 dark:text-green-400' 
              : 'font-semibold text-gray-900 dark:text-gray-100'
            : 'text-gray-800 dark:text-gray-200'
        } ${multiline ? 'text-left' : 'text-right'}`}
      >
        {value}
      </span>
    </div>
  );
}
