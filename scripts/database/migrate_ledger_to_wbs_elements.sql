-- Migration script to replace WBS Category/Subcategory with WBS Elements in Ledger
-- This script migrates existing ledger entries to use the new hierarchical WBS structure

-- Step 1: Create backup of current ledger data
CREATE TABLE IF NOT EXISTS ledger_entry_backup AS 
SELECT * FROM ledger_entry;

-- Step 2: Update existing ledger entries to reference WBS elements
-- Map existing category/subcategory combinations to WBS elements
UPDATE ledger_entry 
SET "wbsElementId" = (
    SELECT we.id 
    FROM wbs_element we 
    WHERE we."programId" = ledger_entry."programId" 
    AND (
        -- Try to match by subcategory name first (most specific)
        we.name = ledger_entry.wbs_subcategory
        OR 
        -- Fallback to category name if no subcategory match
        (ledger_entry.wbs_subcategory IS NULL OR ledger_entry.wbs_subcategory = '')
        AND we.name = ledger_entry.wbs_category
    )
    LIMIT 1
)
WHERE "wbsElementId" IS NULL 
AND (wbs_category IS NOT NULL OR wbs_subcategory IS NOT NULL);

-- Step 3: Show migration results
SELECT 'Migration Results:' as info;
SELECT 
    COUNT(*) as total_entries,
    COUNT("wbsElementId") as migrated_entries,
    COUNT(*) - COUNT("wbsElementId") as unmigrated_entries
FROM ledger_entry;

-- Step 4: Show unmigrated entries for manual review
SELECT 'Unmigrated entries (need manual review):' as info;
SELECT 
    le.id,
    le.vendor_name,
    le.expense_description,
    le.wbs_category,
    le.wbs_subcategory,
    p.name as program_name
FROM ledger_entry le
JOIN program p ON p.id = le."programId"
WHERE le."wbsElementId" IS NULL 
AND (le.wbs_category IS NOT NULL OR le.wbs_subcategory IS NOT NULL)
ORDER BY p.name, le.wbs_category, le.wbs_subcategory;

-- Step 5: Show WBS element mapping summary
SELECT 'WBS Element mapping summary:' as info;
SELECT 
    p.name as program_name,
    COUNT(le.id) as total_entries,
    COUNT(le."wbsElementId") as entries_with_wbs_element,
    COUNT(DISTINCT le."wbsElementId") as unique_wbs_elements_used
FROM ledger_entry le
JOIN program p ON p.id = le."programId"
GROUP BY p.id, p.name
ORDER BY p.name;

-- Step 6: Verify data integrity
SELECT 'Data integrity check:' as info;
SELECT 
    'Entries with both old and new WBS' as check_type,
    COUNT(*) as count
FROM ledger_entry 
WHERE wbs_category IS NOT NULL 
AND wbs_subcategory IS NOT NULL 
AND "wbsElementId" IS NOT NULL

UNION ALL

SELECT 
    'Entries with only old WBS' as check_type,
    COUNT(*) as count
FROM ledger_entry 
WHERE (wbs_category IS NOT NULL OR wbs_subcategory IS NOT NULL)
AND "wbsElementId" IS NULL

UNION ALL

SELECT 
    'Entries with only new WBS' as check_type,
    COUNT(*) as count
FROM ledger_entry 
WHERE (wbs_category IS NULL AND wbs_subcategory IS NULL)
AND "wbsElementId" IS NOT NULL;

-- Note: After verifying the migration is successful, you can run:
-- ALTER TABLE ledger_entry DROP COLUMN wbs_category;
-- ALTER TABLE ledger_entry DROP COLUMN wbs_subcategory;
-- DROP TABLE wbs_category;
-- DROP TABLE wbs_subcategory; 