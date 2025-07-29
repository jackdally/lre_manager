-- Add WBS elements that match existing cost categories
-- This script creates WBS elements for the cost categories found in ledger entries

-- First, let's see what cost categories exist
SELECT 'Existing cost categories:' as info;
SELECT DISTINCT wbs_category, wbs_subcategory 
FROM ledger_entry 
ORDER BY wbs_category, wbs_subcategory;

-- Add WBS elements for the cost categories
-- We'll create a hierarchical structure based on the existing categories

-- 1001: Direct Labor Cost
INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
SELECT 
    gen_random_uuid(),
    '1001.0',
    'Direct Labor Cost',
    'Direct labor costs for project personnel',
    1,
    NULL,
    "programId"
FROM ledger_entry 
WHERE wbs_category = '1001: Direct Labor Cost'
LIMIT 1;

-- Get the parent ID for Direct Labor Cost
DO $$
DECLARE
    direct_labor_id uuid;
    program_record RECORD;
BEGIN
    FOR program_record IN SELECT DISTINCT "programId" FROM ledger_entry WHERE wbs_category = '1001: Direct Labor Cost' LOOP
        SELECT id INTO direct_labor_id 
        FROM wbs_element 
        WHERE code = '1001.0' AND "programId" = program_record."programId";
        
        -- Add subcategories under Direct Labor Cost
        INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
        SELECT 
            gen_random_uuid(),
            '1001.' || ROW_NUMBER() OVER (ORDER BY wbs_subcategory),
            wbs_subcategory,
            'Direct labor cost for ' || wbs_subcategory,
            2,
            direct_labor_id,
            program_record."programId"
        FROM (
            SELECT DISTINCT wbs_subcategory 
            FROM ledger_entry 
            WHERE wbs_category = '1001: Direct Labor Cost' 
            AND "programId" = program_record."programId"
        ) subcats;
    END LOOP;
END $$;

-- 1002: Direct Material Cost
INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
SELECT 
    gen_random_uuid(),
    '1002.0',
    'Direct Material Cost',
    'Direct material costs for project components',
    1,
    NULL,
    "programId"
FROM ledger_entry 
WHERE wbs_category = '1002: Direct Material Cost'
LIMIT 1;

-- Get the parent ID for Direct Material Cost
DO $$
DECLARE
    direct_material_id uuid;
    program_record RECORD;
BEGIN
    FOR program_record IN SELECT DISTINCT "programId" FROM ledger_entry WHERE wbs_category = '1002: Direct Material Cost' LOOP
        SELECT id INTO direct_material_id 
        FROM wbs_element 
        WHERE code = '1002.0' AND "programId" = program_record."programId";
        
        -- Add subcategories under Direct Material Cost
        INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
        SELECT 
            gen_random_uuid(),
            '1002.' || ROW_NUMBER() OVER (ORDER BY wbs_subcategory),
            wbs_subcategory,
            'Direct material cost for ' || wbs_subcategory,
            2,
            direct_material_id,
            program_record."programId"
        FROM (
            SELECT DISTINCT wbs_subcategory 
            FROM ledger_entry 
            WHERE wbs_category = '1002: Direct Material Cost' 
            AND "programId" = program_record."programId"
        ) subcats;
    END LOOP;
END $$;

-- 1003: Other Direct Costs
INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
SELECT 
    gen_random_uuid(),
    '1003.0',
    'Other Direct Costs',
    'Other direct costs for the project',
    1,
    NULL,
    "programId"
FROM ledger_entry 
WHERE wbs_category = '1003: Other Direct Costs'
LIMIT 1;

-- Get the parent ID for Other Direct Costs
DO $$
DECLARE
    other_costs_id uuid;
    program_record RECORD;
BEGIN
    FOR program_record IN SELECT DISTINCT "programId" FROM ledger_entry WHERE wbs_category = '1003: Other Direct Costs' LOOP
        SELECT id INTO other_costs_id 
        FROM wbs_element 
        WHERE code = '1003.0' AND "programId" = program_record."programId";
        
        -- Add subcategories under Other Direct Costs
        INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
        SELECT 
            gen_random_uuid(),
            '1003.' || ROW_NUMBER() OVER (ORDER BY wbs_subcategory),
            wbs_subcategory,
            'Other direct cost for ' || wbs_subcategory,
            2,
            other_costs_id,
            program_record."programId"
        FROM (
            SELECT DISTINCT wbs_subcategory 
            FROM ledger_entry 
            WHERE wbs_category = '1003: Other Direct Costs' 
            AND "programId" = program_record."programId"
        ) subcats;
    END LOOP;
END $$;

-- Show the new WBS elements
SELECT 'New WBS elements created:' as info;
SELECT 
    we.code,
    we.name,
    we.level,
    p.name as program_name
FROM wbs_element we
JOIN program p ON p.id = we."programId"
WHERE we.code LIKE '100%'
ORDER BY we.code; 