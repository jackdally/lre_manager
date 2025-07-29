import { createConnection, IsNull } from 'typeorm';
import { Vendor } from '../../backend/src/entities/Vendor';
import { LedgerEntry } from '../../backend/src/entities/LedgerEntry';

async function migrateVendors() {
  console.log('Starting vendor migration...');
  
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lre_manager',
    entities: [Vendor, LedgerEntry],
    synchronize: false,
    logging: false,
  });

  const vendorRepo = connection.getRepository(Vendor);
  const ledgerRepo = connection.getRepository(LedgerEntry);

  try {
    // Step 1: Get all unique vendor names from ledger entries
    console.log('Step 1: Extracting unique vendor names from ledger entries...');
    const uniqueVendorNames = await ledgerRepo
      .createQueryBuilder('ledger')
      .select('DISTINCT ledger.vendor_name', 'vendor_name')
      .where('ledger.vendor_name IS NOT NULL')
      .andWhere('ledger.vendor_name != :emptyString', { emptyString: '' })
      .getRawMany();

    console.log(`Found ${uniqueVendorNames.length} unique vendor names`);

    // Step 2: Create vendor entities for each unique name
    console.log('Step 2: Creating vendor entities...');
    let vendorsCreated = 0;
    let vendorsSkipped = 0;

    for (const vendorData of uniqueVendorNames) {
      const vendorName = vendorData.vendor_name;
      
      // Check if vendor already exists
      const existingVendor = await vendorRepo.findOne({
        where: { name: vendorName }
      });

      if (existingVendor) {
        vendorsSkipped++;
        continue;
      }

      // Create new vendor
      const vendor = vendorRepo.create({
        name: vendorName,
        isActive: true
      });

      await vendorRepo.save(vendor);
      vendorsCreated++;
    }

    console.log(`Created ${vendorsCreated} new vendors, skipped ${vendorsSkipped} existing vendors`);

    // Step 3: Update ledger entries to reference vendor entities
    console.log('Step 3: Updating ledger entries with vendor references...');
    const allVendors = await vendorRepo.find();
    const vendorMap = new Map(allVendors.map(v => [v.name, v.id]));
    
    let ledgerEntriesUpdated = 0;
    let ledgerEntriesSkipped = 0;

    const ledgerEntries = await ledgerRepo.find({
      where: { vendorId: IsNull() },
      relations: ['vendor']
    });

    for (const ledgerEntry of ledgerEntries) {
      if (!ledgerEntry.vendor_name) {
        ledgerEntriesSkipped++;
        continue;
      }

      const vendorId = vendorMap.get(ledgerEntry.vendor_name);
      if (vendorId) {
        ledgerEntry.vendorId = vendorId;
        await ledgerRepo.save(ledgerEntry);
        ledgerEntriesUpdated++;
      } else {
        console.warn(`No vendor found for name: ${ledgerEntry.vendor_name}`);
        ledgerEntriesSkipped++;
      }
    }

    console.log(`Updated ${ledgerEntriesUpdated} ledger entries, skipped ${ledgerEntriesSkipped} entries`);

    // Step 4: Verify migration
    console.log('Step 4: Verifying migration...');
    const totalVendors = await vendorRepo.count();
    const totalLedgerEntriesWithVendor = await ledgerRepo.count({
      where: { vendorId: IsNull() }
    });

    console.log(`Migration completed successfully!`);
    console.log(`- Total vendors in database: ${totalVendors}`);
    console.log(`- Ledger entries without vendor reference: ${totalLedgerEntriesWithVendor}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateVendors()
    .then(() => {
      console.log('Vendor migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Vendor migration failed:', error);
      process.exit(1);
    });
}

export { migrateVendors }; 