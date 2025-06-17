// To run: npm install typeorm @types/node
// Then: npx ts-node scripts/seed_programs_and_expenses.ts
// You can override DB connection with DB_* environment variables
import { createConnection } from 'typeorm';
import { Program } from '../backend/src/entities/Program';
import { LedgerEntry } from '../backend/src/entities/LedgerEntry';
import { WbsCategory } from '../backend/src/entities/WbsCategory';
import { WbsSubcategory } from '../backend/src/entities/WbsSubcategory';

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAmount(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

const vendors = ['Acme Corp', 'Globex', 'Umbrella', 'Wayne Enterprises', 'Stark Industries'];
const categories = ['Labor', 'Materials', 'Travel', 'Equipment'];
const subcategories = ['Engineering', 'Supplies', 'Flights', 'Machinery'];

async function seed() {
  const connection = await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lre_manager',
    entities: [Program, LedgerEntry, WbsCategory, WbsSubcategory],
    synchronize: false,
    logging: false,
  });
  const programRepo = connection.getRepository(Program);
  const ledgerRepo = connection.getRepository(LedgerEntry);
  const wbsCategoryRepo = connection.getRepository(WbsCategory);
  const wbsSubcategoryRepo = connection.getRepository(WbsSubcategory);

  // Remove all existing data with TRUNCATE CASCADE
  await connection.query('TRUNCATE TABLE "ledger_entry", "wbs_subcategory", "wbs_category", "program" RESTART IDENTITY CASCADE');

  // Programs
  const programs = [
    {
      code: 'POP-001',
      name: 'Period of Performance Alpha',
      description: 'PoP program from end of 2024 to start of 2026',
      status: 'Active',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2026-01-31'),
      totalBudget: 10000000,
      type: 'Period of Performance' as const,
    },
    {
      code: 'POP-002',
      name: 'Period of Performance Beta',
      description: 'PoP program from end of 2024 to start of 2026',
      status: 'Active',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2026-01-31'),
      totalBudget: 10000000,
      type: 'Period of Performance' as const,
    },
    {
      code: 'ANNUAL-2025',
      name: 'Annual Program 2025',
      description: 'Annual program for 2025',
      status: 'Active',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      totalBudget: 10000000,
      type: 'Annual' as const,
    },
  ];

  for (const progData of programs) {
    const program = programRepo.create(progData);
    await programRepo.save(program);
    // Create 2 categories, each with 2 subcategories
    const catNames = ['Labor', 'Materials'];
    const subcatNames = [['Engineering', 'Support'], ['Supplies', 'Equipment']];
    const wbsCategories: WbsCategory[] = [];
    for (let c = 0; c < catNames.length; c++) {
      const cat = wbsCategoryRepo.create({ name: catNames[c], program });
      await wbsCategoryRepo.save(cat);
      for (let s = 0; s < subcatNames[c].length; s++) {
        const subcat = wbsSubcategoryRepo.create({ name: subcatNames[c][s], category: cat });
        await wbsSubcategoryRepo.save(subcat);
      }
      wbsCategories.push(cat);
    }
    // Fetch subcategories for random selection
    const allSubcats = await wbsSubcategoryRepo.find({ where: {}, relations: ['category'] });
    // Generate 20 fake ledger entries
    for (let i = 0; i < 20; i++) {
      const subcat = allSubcats[Math.floor(Math.random() * allSubcats.length)];
      const entry = ledgerRepo.create({
        vendor_name: vendors[Math.floor(Math.random() * vendors.length)],
        expense_description: `Expense ${i + 1} for ${program.code}`,
        wbs_category: subcat.category.name,
        wbs_subcategory: subcat.name,
        baseline_date: randomDate(program.startDate!, program.endDate!).toISOString().slice(0, 10),
        baseline_amount: randomAmount(1000, 100000),
        planned_date: randomDate(program.startDate!, program.endDate!).toISOString().slice(0, 10),
        planned_amount: randomAmount(1000, 100000),
        actual_date: randomDate(program.startDate!, program.endDate!).toISOString().slice(0, 10),
        actual_amount: randomAmount(1000, 100000),
        notes: Math.random() > 0.5 ? 'Urgent' : null,
        program: program,
      });
      await ledgerRepo.save(entry);
    }
    console.log(`Seeded program ${program.code} with 2 WBS categories, 4 subcategories, and 20 expenses.`);
  }
  await connection.close();
  console.log('Seeding complete.');
}

seed().catch(e => { console.error(e); process.exit(1); }); 