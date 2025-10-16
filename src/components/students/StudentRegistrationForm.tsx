'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { studentService, classService } from '@/services';
import { feeStructureService, studentFeeAssignmentService } from '@/services/feeService';
import type { SchoolClass } from '@/types';

interface StudentRegistrationFormProps {
  onSuccess?: (studentId: string) => void;
  onCancel?: () => void;
}

export const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    admissionNumber: '',
    classId: '',
    guardianSurname: '',
    guardianFirstname: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianAddress: '',
    guardianRelationship: 'father' as 'father' | 'mother' | 'guardian' | 'other',
    dateOfBirth: '',
    gender: '' as '' | 'male' | 'female',
    admissionDate: new Date().toISOString().split('T')[0],
    bloodGroup: '',
  });

  // Load classes on mount and when component becomes visible
  React.useEffect(() => {
    loadClasses();
  }, []);

  // Also load classes when the form becomes visible (e.g., modal opens)
  React.useEffect(() => {
    const handleFocus = () => {
      // Refresh classes when window/tab gains focus (user might have created classes in another tab)
      loadClasses();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadClasses = async (forceFresh = false) => {
    try {
      setLoadingClasses(true);
      
      // Note: Cache clearing is handled internally by the service
      
      const activeClasses = await classService.getActiveClasses();
      setClasses(activeClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required';
    if (!formData.admissionNumber.trim()) newErrors.admissionNumber = 'Admission number is required';
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.guardianSurname.trim()) newErrors.guardianSurname = 'Guardian surname is required';
    if (!formData.guardianFirstname.trim()) newErrors.guardianFirstname = 'Guardian first name is required';
    if (!formData.guardianPhone.trim()) newErrors.guardianPhone = 'Guardian phone is required';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';

    // Validate phone number
    if (formData.guardianPhone && !/^[\d\s\-+()]+$/.test(formData.guardianPhone)) {
      newErrors.guardianPhone = 'Invalid phone number format';
    }

    // Validate email if provided
    if (formData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      
      // Get selected class details
      const selectedClass = classes.find(c => c.id === formData.classId);
      if (!selectedClass) {
        throw new Error('Selected class not found');
      }

      // Create student
      const student = await studentService.create({
        surname: formData.surname.trim(),
        firstname: formData.firstname.trim(),
        middlename: formData.middlename.trim() || undefined,
        admissionNumber: formData.admissionNumber.trim(),
        classId: formData.classId,
        className: `${selectedClass.name}${selectedClass.section ? ` ${selectedClass.section}` : ''}`,
        guardianSurname: formData.guardianSurname.trim(),
        guardianFirstname: formData.guardianFirstname.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        guardianEmail: formData.guardianEmail.trim() || undefined,
        guardianAddress: formData.guardianAddress.trim() || undefined,
        guardianRelationship: formData.guardianRelationship,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        admissionDate: formData.admissionDate,
        bloodGroup: formData.bloodGroup.trim() || undefined,
        totalFeesAssigned: 0,
        totalPaid: 0,
        balance: 0,
        isActive: true,
      });

      // Update class enrollment
      await classService.updateEnrollment(formData.classId, 1);

      // Try to automatically assign fee structure for the current academic year and first term
      try {
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}/${currentYear + 1}`;
        const term = 'first' as const;
        
        const feeStructure = await feeStructureService.getByClassAndTerm(
          formData.classId,
          academicYear,
          term
        );
        
        if (feeStructure) {
          await studentFeeAssignmentService.assignFeesToStudent(
            student.id,
            `${student.firstname} ${student.surname}`,
            student.classId,
            student.className,
            feeStructure.id,
            feeStructure.academicYear,
            feeStructure.term,
            feeStructure.feeItems
          );
          
          console.log(`Automatically assigned fee structure to ${student.firstname} ${student.surname}`);
        } else {
          console.log(`No fee structure found for ${selectedClass.name} - ${academicYear} ${term} term`);
        }
      } catch (feeError) {
        console.error('Error auto-assigning fee structure:', feeError);
        // Don't fail the student registration if fee assignment fails
      }

      onSuccess?.(student.id);
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Student Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            error={errors.surname}
            required
          />
          <Input
            label="First Name"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            error={errors.firstname}
            required
          />
          <Input
            label="Middle Name"
            name="middlename"
            value={formData.middlename}
            onChange={handleChange}
          />
          <Input
            label="Admission Number"
            name="admissionNumber"
            value={formData.admissionNumber}
            onChange={handleChange}
            error={errors.admissionNumber}
            helperText="Unique student ID"
            required
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class *
                </label>
                <Select 
                  value={formData.classId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                  disabled={loadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingClasses ? 'Loading classes...' : 'Select a class'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {`${c.name}${c.section ? ` ${c.section}` : ''} (${c.currentEnrollment}/${c.capacity})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.classId}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {classes.length === 0 && !loadingClasses 
                    ? 'No classes available. Use buttons below.' 
                    : `${classes.length} classes available`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => loadClasses(true)}
                disabled={loadingClasses}
                className="mt-6 p-2"
                title="Refresh classes list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingClasses ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/classes')}
              >
                Manage Classes
              </Button>
            </div>
          </div>
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as typeof formData.gender }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            placeholder="e.g., O+"
          />
          <Input
            label="Admission Date"
            name="admissionDate"
            type="date"
            value={formData.admissionDate}
            onChange={handleChange}
            error={errors.admissionDate}
            required
          />
        </div>
      </div>

      {/* Guardian Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Guardian Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Guardian Surname"
            name="guardianSurname"
            value={formData.guardianSurname}
            onChange={handleChange}
            error={errors.guardianSurname}
            required
          />
          <Input
            label="Guardian First Name"
            name="guardianFirstname"
            value={formData.guardianFirstname}
            onChange={handleChange}
            error={errors.guardianFirstname}
            required
          />
          <Input
            label="Guardian Phone"
            name="guardianPhone"
            type="tel"
            value={formData.guardianPhone}
            onChange={handleChange}
            error={errors.guardianPhone}
            required
          />
          <Input
            label="Guardian Email"
            name="guardianEmail"
            type="email"
            value={formData.guardianEmail}
            onChange={handleChange}
            error={errors.guardianEmail}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relationship
            </label>
            <Select 
              value={formData.guardianRelationship} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, guardianRelationship: value as typeof formData.guardianRelationship }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input
              label="Guardian Address"
              name="guardianAddress"
              value={formData.guardianAddress}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Register Student
        </Button>
      </div>
    </form>
  );
};
