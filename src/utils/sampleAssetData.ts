import { fixedAssetService } from '@/services/assetService';
import type { FixedAsset } from '@/types';

// Sample asset data for testing
export const sampleAssets: Omit<FixedAsset, 'id' | 'createdAt' | 'updatedAt' | 'assetCode' | 'currentValue' | 'accumulatedDepreciation'>[] = [
  {
    assetName: 'Dell OptiPlex Desktop Computer',
    category: 'computer_equipment',
    purchasePrice: 150000,
    residualValue: 15000,
    purchaseDate: '2024-01-15',
    vendor: 'Tech Solutions Ltd',
    location: 'IT Department',
    condition: 'good',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 5,
    description: 'Desktop computer for administrative use',
    serialNumber: 'DLL-2024-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Classroom Projector - Epson',
    category: 'audio_visual_equipment',
    purchasePrice: 85000,
    residualValue: 8500,
    purchaseDate: '2024-02-10',
    vendor: 'AV Solutions Nigeria',
    location: 'Classroom A1',
    condition: 'excellent',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 7,
    description: 'High-definition projector for classroom presentations',
    serialNumber: 'EPS-PRJ-2024-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Laboratory Microscope Set',
    category: 'laboratory_equipment',
    purchasePrice: 320000,
    residualValue: 32000,
    purchaseDate: '2024-03-05',
    vendor: 'Scientific Equipment Co.',
    location: 'Science Laboratory',
    condition: 'excellent',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 10,
    description: 'Set of 20 compound microscopes for biology classes',
    serialNumber: 'SCI-MIC-2024-001',
    createdBy: 'admin',
  },
  {
    assetName: 'School Bus - Toyota Hiace',
    category: 'school_buses',
    purchasePrice: 12000000,
    residualValue: 2400000,
    purchaseDate: '2023-09-15',
    vendor: 'Toyota Motors Nigeria',
    location: 'School Garage',
    condition: 'good',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 8,
    description: '18-seater school bus for student transportation',
    serialNumber: 'TOY-BUS-2023-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Classroom Furniture Set (30 desks)',
    category: 'classroom_furniture',
    purchasePrice: 450000,
    residualValue: 45000,
    purchaseDate: '2024-01-20',
    vendor: 'School Furniture Ltd',
    location: 'Primary 3 Classroom',
    condition: 'good',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 15,
    description: 'Set of 30 student desks and chairs',
    serialNumber: 'SFL-DESK-2024-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Generator - Perkins 15KVA',
    category: 'generator',
    purchasePrice: 850000,
    residualValue: 85000,
    purchaseDate: '2023-11-10',
    vendor: 'Power Solutions Nigeria',
    location: 'Generator House',
    condition: 'good',
    status: 'under-maintenance',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 12,
    description: 'Backup power generator for school facility',
    serialNumber: 'PER-GEN-2023-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Library Books Collection',
    category: 'library_books',
    purchasePrice: 280000,
    residualValue: 28000,
    purchaseDate: '2024-04-01',
    vendor: 'Academic Publishers Ltd',
    location: 'School Library',
    condition: 'excellent',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 20,
    description: 'Collection of 500 academic and reference books',
    serialNumber: 'LIB-BOOK-2024-001',
    createdBy: 'admin',
  },
  {
    assetName: 'Air Conditioning Unit - Samsung',
    category: 'air_conditioning',
    purchasePrice: 180000,
    residualValue: 18000,
    purchaseDate: '2024-05-15',
    vendor: 'Cool Air Systems',
    location: 'Principal Office',
    condition: 'excellent',
    status: 'active',
    depreciationMethod: 'straight-line',
    usefulLifeYears: 8,
    description: '2HP split air conditioning unit',
    serialNumber: 'SAM-AC-2024-001',
    createdBy: 'admin',
  }
];

/**
 * Create sample assets in the database
 */
export async function createSampleAssets(): Promise<void> {
  console.log('Creating sample assets...');
  
  try {
    // Check if assets already exist
    const existingAssets = await fixedAssetService.list();
    if (existingAssets.length > 0) {
      console.log(`Found ${existingAssets.length} existing assets. Skipping sample data creation.`);
      return;
    }

    // Create each sample asset
    const createdAssets = [];
    for (const assetData of sampleAssets) {
      try {
        const asset = await fixedAssetService.createAsset(assetData);
        createdAssets.push(asset);
        console.log(`✅ Created asset: ${asset.assetName} (${asset.assetCode})`);
      } catch (error) {
        console.error(`❌ Failed to create asset: ${assetData.assetName}`, error);
      }
    }

    console.log(`🎉 Successfully created ${createdAssets.length} sample assets!`);
    
    // Calculate total value
    const totalValue = createdAssets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    console.log(`💰 Total asset value: ₦${totalValue.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error creating sample assets:', error);
    throw error;
  }
}

/**
 * Check if sample assets exist
 */
export async function checkAssetData(): Promise<{
  hasAssets: boolean;
  assetCount: number;
  totalValue: number;
}> {
  try {
    const assets = await fixedAssetService.list();
    const totalValue = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    
    return {
      hasAssets: assets.length > 0,
      assetCount: assets.length,
      totalValue
    };
  } catch (error) {
    console.error('Error checking asset data:', error);
    return {
      hasAssets: false,
      assetCount: 0,
      totalValue: 0
    };
  }
}