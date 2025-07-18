-- Migration script to populate vendor table from existing ledger entries
-- and update ledger entries to reference vendor entities

-- Step 1: Insert unique vendor names from ledger entries into vendor table
INSERT INTO vendor (name, is_active, created_at, updated_at)
SELECT DISTINCT 
    vendor_name,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM ledger_entry 
WHERE vendor_name IS NOT NULL 
    AND vendor_name != ''
    AND vendor_name NOT IN (SELECT name FROM vendor)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Update ledger entries to reference vendor entities
UPDATE ledger_entry 
SET vendor_id = v.id
FROM vendor v
WHERE ledger_entry.vendor_name = v.name
    AND ledger_entry.vendor_id IS NULL;

-- Step 3: Create index on vendor_id for performance
CREATE INDEX IF NOT EXISTS idx_ledger_entry_vendor_id ON ledger_entry(vendor_id);

-- Step 4: Add constraint to ensure vendor_id references valid vendor
ALTER TABLE ledger_entry 
ADD CONSTRAINT fk_ledger_entry_vendor 
FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE SET NULL;

-- Step 5: Log the migration results
DO $$
DECLARE
    vendor_count INTEGER;
    updated_ledger_count INTEGER;
BEGIN
    -- Count vendors created
    SELECT COUNT(*) INTO vendor_count FROM vendor;
    
    -- Count ledger entries updated
    SELECT COUNT(*) INTO updated_ledger_count FROM ledger_entry WHERE vendor_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed: % vendors created, % ledger entries updated with vendor references', 
        vendor_count, updated_ledger_count;
END $$; 