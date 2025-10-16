'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fixedAssetService } from '@/services';
import type { SimpleAsset } from '@/types';
import { convertUIAssetToServiceCreation } from '@/utils/assetMapping';
import {
  DollarSign,
  FileText,
  Package,
  MapPin,
  CheckCircle
} from 'lucide-react';

interface AssetFormData {
  assetNumber: string;
  name: string;
  category: SimpleAsset['category'];
  description: string;
  purchaseDate: string;
  purchasePrice: number;
  vendor: string;
  location: string;
  department: string;
  condition: SimpleAsset['condition'];
  serialNumber: string;
  warranty: {
    startDate: string;
    endDate: string;
    provider: string;
    terms: string;
  };
  notes: string;
}

interface AssetRegistrationFormProps {
  asset?: SimpleAsset;
  onSuccess: () => void;
  onCancel: () => void;
}

const assetCategories = [
  { value: 'furniture', label: 'Furniture & Fixtures' },
  { value: 'electronics', label: 'Electronics & IT Equipment' },
  { value: 'vehicles', label: 'Vehicles & Transportation' },
  { value: 'equipment', label: 'Equipment & Machinery' },
  { value: 'buildings', label: 'Buildings & Infrastructure' },
  { value: 'land', label: 'Land & Property' },
  { value: 'books', label: 'Books & Educational Materials' },
  { value: 'sports', label: 'Sports & Recreation' },
  { value: 'laboratory', label: 'Laboratory Equipment' },
  { value: 'other', label: 'Other Assets' }
];

const assetConditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'needs_repair', label: 'Needs Repair' }
];

const departments = [
  'Administration',
  'Academic Affairs',
  'IT Department',
  'Facilities Management',
  'Library',
  'Laboratory',
  'Sports Department',
  'Security',
  'Maintenance',
  'Transport',
  'General'
];

export default function AssetRegistrationForm({
  asset,
  onSuccess,
  onCancel
}: AssetRegistrationFormProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AssetFormData>({
    assetNumber: asset?.assetNumber || '',
    name: asset?.name || '',
    category: asset?.category || 'equipment',
    description: asset?.description || '',
    purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
    purchasePrice: asset?.purchasePrice || 0,
    vendor: asset?.vendor || '',
    location: asset?.location || '',
    department: asset?.department || '',
    condition: asset?.condition || 'good',
    serialNumber: asset?.serialNumber || '',
    warranty: {
      startDate: asset?.warranty?.startDate ? new Date(asset.warranty.startDate).toISOString().split('T')[0] : '',
      endDate: asset?.warranty?.endDate ? new Date(asset.warranty.endDate).toISOString().split('T')[0] : '',
      provider: asset?.warranty?.provider || '',
      terms: asset?.warranty?.terms || ''
    },
    notes: asset?.notes || ''
  });

  const handleInputChange = (field: keyof AssetFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (value: string) => {
    console.log('Category changed to:', value);
    setFormData(prev => ({
      ...prev,
      category: value as SimpleAsset['category']
    }));
    
    // Clear error when user starts typing
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleConditionChange = (value: string) => {
    console.log('Condition changed to:', value);
    setFormData(prev => ({
      ...prev,
      condition: value as SimpleAsset['condition']
    }));
    
    // Clear error when user starts typing
    if (errors.condition) {
      setErrors(prev => ({ ...prev, condition: '' }));
    }
  };

  const handleDepartmentChange = (value: string) => {
    console.log('Department changed to:', value);
    setFormData(prev => ({
      ...prev,
      department: value
    }));
    
    // Clear error when user starts typing
    if (errors.department) {
      setErrors(prev => ({ ...prev, department: '' }));
    }
  };

  const handleWarrantyChange = (field: keyof AssetFormData['warranty'], value: string) => {
    setFormData(prev => ({
      ...prev,
      warranty: {
        ...prev.warranty,
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetNumber.trim()) {
      newErrors.assetNumber = 'Asset number is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    // Validate warranty dates if provided
    if (formData.warranty.startDate && formData.warranty.endDate) {
      if (new Date(formData.warranty.startDate) > new Date(formData.warranty.endDate)) {
        newErrors.warrantyEndDate = 'Warranty end date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateAssetNumber = () => {
    const category = formData.category.toUpperCase().substring(0, 3);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const assetNumber = `${category}-${year}-${random}`;
    handleInputChange('assetNumber', assetNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !appUser) return;

    try {
      setLoading(true);

      const uiAsset: Omit<SimpleAsset, 'id' | 'createdAt' | 'updatedAt'> = {
        assetNumber: formData.assetNumber,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice,
        currentValue: formData.purchasePrice,
        vendor: formData.vendor,
        location: formData.location,
        department: formData.department,
        condition: formData.condition,
        serialNumber: formData.serialNumber,
        warranty: formData.warranty.startDate ? {
          startDate: formData.warranty.startDate,
          endDate: formData.warranty.endDate,
          provider: formData.warranty.provider,
          terms: formData.warranty.terms
        } : undefined,
        notes: formData.notes,
        status: 'active',
        recordedBy: appUser.id
      };
      
      const assetData = convertUIAssetToServiceCreation(uiAsset);

      if (asset) {
        await fixedAssetService.update(asset.id, assetData);
        toast({
          title: "Asset Updated",
          description: `${formData.name} has been updated successfully`,
        });
      } else {
        await fixedAssetService.createAsset(assetData);
        toast({
          title: "Asset Registered",
          description: `${formData.name} has been registered successfully`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: "Error",
        description: "Failed to save asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto" style={{ position: 'relative' }}>
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assetNumber">Asset Number *</Label>
              <div className="flex gap-2">
                <Input
                  id="assetNumber"
                  value={formData.assetNumber}
                  onChange={(e) => handleInputChange('assetNumber', e.target.value)}
                  className={errors.assetNumber ? 'border-red-500' : ''}
                  placeholder="e.g., EQP-2024-0001"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAssetNumber}
                >
                  Generate
                </Button>
              </div>
              {errors.assetNumber && <p className="text-sm text-red-500 mt-1">{errors.assetNumber}</p>}
            </div>

            <div>
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="e.g., Dell OptiPlex 7090"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {assetCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="e.g., SN123456789"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
              placeholder="Detailed description of the asset..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Purchase Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Purchase Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                className={errors.purchaseDate ? 'border-red-500' : ''}
              />
              {errors.purchaseDate && <p className="text-sm text-red-500 mt-1">{errors.purchaseDate}</p>}
            </div>

            <div>
              <Label htmlFor="purchasePrice">Purchase Price (₦) *</Label>
              <Input
                id="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                className={errors.purchasePrice ? 'border-red-500' : ''}
                placeholder="0.00"
              />
              {errors.purchasePrice && <p className="text-sm text-red-500 mt-1">{errors.purchasePrice}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="vendor">Vendor/Supplier *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                className={errors.vendor ? 'border-red-500' : ''}
                placeholder="e.g., Dell Technologies Nigeria"
              />
              {errors.vendor && <p className="text-sm text-red-500 mt-1">{errors.vendor}</p>}
            </div>
          </div>
        </div>

        {/* Location & Condition */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location & Condition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
                placeholder="e.g., Computer Lab 1, Room 201"
              />
              {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={handleDepartmentChange}>
                <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={handleConditionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {assetConditions.map(condition => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Warranty Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Warranty Information (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warrantyStartDate">Warranty Start Date</Label>
              <Input
                id="warrantyStartDate"
                type="date"
                value={formData.warranty.startDate}
                onChange={(e) => handleWarrantyChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
              <Input
                id="warrantyEndDate"
                type="date"
                value={formData.warranty.endDate}
                onChange={(e) => handleWarrantyChange('endDate', e.target.value)}
                className={errors.warrantyEndDate ? 'border-red-500' : ''}
              />
              {errors.warrantyEndDate && <p className="text-sm text-red-500 mt-1">{errors.warrantyEndDate}</p>}
            </div>

            <div>
              <Label htmlFor="warrantyProvider">Warranty Provider</Label>
              <Input
                id="warrantyProvider"
                value={formData.warranty.provider}
                onChange={(e) => handleWarrantyChange('provider', e.target.value)}
                placeholder="e.g., Dell Warranty Services"
              />
            </div>

            <div>
              <Label htmlFor="warrantyTerms">Warranty Terms</Label>
              <Input
                id="warrantyTerms"
                value={formData.warranty.terms}
                onChange={(e) => handleWarrantyChange('terms', e.target.value)}
                placeholder="e.g., 3 years parts and labor"
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Information
          </h3>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this asset..."
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : asset ? 'Update Asset' : 'Register Asset'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}