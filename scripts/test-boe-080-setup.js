const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
const TEST_PROGRAM_ID = 'efcb3e0a-82f5-45b1-b60d-2ee62ef03916';

async function clearTestData() {
  console.log('🧹 Clearing existing test data...');
  
  try {
    // Get current ledger entries
    const ledgerResponse = await axios.get(`${BASE_URL}/programs/${TEST_PROGRAM_ID}/ledger`);
    const ledgerEntries = ledgerResponse.data.entries || [];
    
    console.log(`Found ${ledgerEntries.length} ledger entries to delete`);
    
    // Delete each ledger entry
    for (const entry of ledgerEntries) {
      await axios.delete(`${BASE_URL}/ledger/${entry.id}`);
      console.log(`Deleted ledger entry: ${entry.id}`);
    }
    
    // Get current BOE
    const boeResponse = await axios.get(`${BASE_URL}/programs/${TEST_PROGRAM_ID}/boe`);
    const currentBOE = boeResponse.data.currentBOE;
    
    if (currentBOE) {
      await axios.delete(`${BASE_URL}/boe/${currentBOE.id}`);
      console.log(`Deleted BOE: ${currentBOE.id}`);
    }
    
    console.log('✅ Test data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing test data:', error.response?.data || error.message);
  }
}

async function createTestBOE() {
  console.log('📋 Creating test BOE with allocations...');
  
  try {
    // Create BOE with 2 elements and 4 allocations each
    const boeData = {
      name: 'BOE-080 Test BOE',
      description: 'Test BOE for BOE-080 invoice matching enhancements',
      elements: [
        {
          code: 'TE-001',
          name: 'Software Development',
          description: 'Core software development activities',
          level: 1,
          estimatedCost: 50000,
          costCategoryId: 'ab719ce9-5028-4d37-8957-fead0ee50b44', // Software category
          vendorId: null,
          allocations: [
            {
              name: 'June 2025 Development',
              description: 'Initial development phase',
              allocationType: 'Linear',
              totalAmount: 12500,
              totalQuantity: 80, // hours
              startDate: '2025-06-01',
              endDate: '2025-06-30'
            },
            {
              name: 'July 2025 Development',
              description: 'Core development phase',
              allocationType: 'Front-Loaded',
              totalAmount: 15000,
              totalQuantity: 100, // hours
              startDate: '2025-07-01',
              endDate: '2025-07-31'
            },
            {
              name: 'August 2025 Development',
              description: 'Feature development phase',
              allocationType: 'Linear',
              totalAmount: 12500,
              totalQuantity: 80, // hours
              startDate: '2025-08-01',
              endDate: '2025-08-31'
            },
            {
              name: 'September 2025 Development',
              description: 'Final development phase',
              allocationType: 'Back-Loaded',
              totalAmount: 10000,
              totalQuantity: 60, // hours
              startDate: '2025-09-01',
              endDate: '2025-09-30'
            }
          ]
        },
        {
          code: 'TE-002',
          name: 'Hardware Procurement',
          description: 'Hardware and equipment procurement',
          level: 1,
          estimatedCost: 30000,
          costCategoryId: 'ab719ce9-5028-4d37-8957-fead0ee50b44', // Hardware category
          vendorId: null,
          allocations: [
            {
              name: 'June 2025 Hardware',
              description: 'Initial hardware procurement',
              allocationType: 'Linear',
              totalAmount: 7500,
              totalQuantity: 5, // units
              startDate: '2025-06-01',
              endDate: '2025-06-30'
            },
            {
              name: 'July 2025 Hardware',
              description: 'Additional hardware procurement',
              allocationType: 'Linear',
              totalAmount: 7500,
              totalQuantity: 5, // units
              startDate: '2025-07-01',
              endDate: '2025-07-31'
            },
            {
              name: 'August 2025 Hardware',
              description: 'Final hardware procurement',
              allocationType: 'Linear',
              totalAmount: 7500,
              totalQuantity: 5, // units
              startDate: '2025-08-01',
              endDate: '2025-08-31'
            },
            {
              name: 'September 2025 Hardware',
              description: 'Spare hardware procurement',
              allocationType: 'Linear',
              totalAmount: 7500,
              totalQuantity: 5, // units
              startDate: '2025-09-01',
              endDate: '2025-09-30'
            }
          ]
        }
      ]
    };
    
    // Create BOE with allocations
    const boeResponse = await axios.post(`${BASE_URL}/programs/${TEST_PROGRAM_ID}/boe`, boeData);
    console.log('✅ Test BOE created successfully');
    console.log('BOE ID:', boeResponse.data.boeVersion.id);
    
    return boeResponse.data.boeVersion.id;
  } catch (error) {
    console.error('❌ Error creating test BOE:', error.response?.data || error.message);
    throw error;
  }
}

async function pushBOEToLedger(boeVersionId) {
  console.log('📤 Pushing BOE to ledger...');
  
  try {
    const response = await axios.post(`${BASE_URL}/programs/${TEST_PROGRAM_ID}/boe/${boeVersionId}/push-to-ledger`);
    console.log('✅ BOE pushed to ledger successfully');
    console.log('Ledger entries created:', response.data.entriesCreated);
    
    return response.data.entriesCreated;
  } catch (error) {
    console.error('❌ Error pushing BOE to ledger:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestActuals() {
  console.log('📊 Creating test actuals data...');
  
  try {
    // Get ledger entries to match against
    const ledgerResponse = await axios.get(`${BASE_URL}/programs/${TEST_PROGRAM_ID}/ledger`);
    const ledgerEntries = ledgerResponse.data.entries || [];
    
    if (ledgerEntries.length === 0) {
      console.log('⚠️ No ledger entries found to create actuals for');
      return;
    }
    
    // Create test actuals that match the ledger entries
    const testActuals = [
      {
        vendorName: 'SWE',
        description: 'Software Development Services - June 2025',
        amount: 12000,
        transactionDate: '2025-06-15',
        category: 'Software',
        subcategory: 'Development',
        invoiceNumber: 'INV-2025-001',
        referenceNumber: 'https://example.com/invoice/2025-001'
      },
      {
        vendorName: 'HW Supplier',
        description: 'Hardware Procurement - July 2025',
        amount: 7500,
        transactionDate: '2025-07-10',
        category: 'Hardware',
        subcategory: 'Equipment',
        invoiceNumber: 'INV-2025-002',
        referenceNumber: 'https://example.com/invoice/2025-002'
      }
    ];
    
    // Create import session for actuals
    const sessionData = {
      description: 'BOE-080 Test Actuals',
      config: {
        programCodeColumn: 'Program Code',
        vendorColumn: 'Vendor Name',
        descriptionColumn: 'Description',
        amountColumn: 'Amount',
        dateColumn: 'Transaction Date',
        categoryColumn: 'Category',
        subcategoryColumn: 'Subcategory',
        invoiceColumn: 'Invoice Number',
        referenceColumn: 'Reference Number',
        dateFormat: 'YYYY-MM-DD',
        amountTolerance: 0.01,
        matchThreshold: 0.7
      }
    };
    
    // Create session
    const sessionResponse = await axios.post(`${BASE_URL}/import/${TEST_PROGRAM_ID}/upload`, sessionData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Test actuals session created');
    console.log('Session ID:', sessionResponse.data.sessionId);
    
    // Add transactions to session
    for (const actual of testActuals) {
      await axios.post(`${BASE_URL}/import/session/${sessionResponse.data.sessionId}/transactions`, actual);
    }
    
    console.log('✅ Test actuals transactions added');
    
    // Run smart matching
    await axios.post(`${BASE_URL}/import/session/${sessionResponse.data.sessionId}/smart-matching`);
    console.log('✅ Smart matching completed');
    
    return sessionResponse.data.sessionId;
  } catch (error) {
    console.error('❌ Error creating test actuals:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting BOE-080 Test Setup');
  console.log('Test Program ID:', TEST_PROGRAM_ID);
  console.log('');
  
  try {
    // Step 1: Clear existing data
    await clearTestData();
    console.log('');
    
    // Step 2: Create test BOE
    const boeVersionId = await createTestBOE();
    console.log('');
    
    // Step 3: Push BOE to ledger
    await pushBOEToLedger(boeVersionId);
    console.log('');
    
    // Step 4: Create test actuals
    await createTestActuals();
    console.log('');
    
    console.log('🎉 BOE-080 Test Setup Complete!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('- Test Program: TEST-BOE-079');
    console.log('- BOE Version ID:', boeVersionId);
    console.log('- 2 BOE Elements with 4 allocations each');
    console.log('- Allocations starting June 2025');
    console.log('- 2 test actuals created for matching');
    console.log('');
    console.log('🔗 Next Steps:');
    console.log('1. Go to http://localhost:3000/programs/TEST-BOE-079/actuals');
    console.log('2. Check the upload sessions');
    console.log('3. Test the matching functionality');
    console.log('4. Verify BOE context appears in TransactionMatchModal');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
}

main(); 