-- Cleanup script to remove duplicate WBS elements
-- This script removes duplicate elements that may have been created by running the migration multiple times

-- First, let's see what duplicates exist
SELECT 'Current duplicates:' as info;
SELECT code, name, COUNT(*) as count 
FROM wbs_element 
GROUP BY code, name, "programId" 
HAVING COUNT(*) > 1 
ORDER BY code, name;

-- Delete duplicate elements using a more direct approach
-- Keep the first element (by creation time) and delete the rest
DELETE FROM wbs_element 
WHERE id IN (
    SELECT we2.id
    FROM wbs_element we1
    JOIN wbs_element we2 ON 
        we1.code = we2.code AND 
        we1.name = we2.name AND 
        we1."programId" = we2."programId" AND
        we1.id != we2.id AND
        we1."createdAt" <= we2."createdAt"
);

-- Verify cleanup
SELECT 'After cleanup - remaining elements:' as info;
SELECT code, name, COUNT(*) as count 
FROM wbs_element 
GROUP BY code, name, "programId" 
HAVING COUNT(*) > 1 
ORDER BY code, name;

-- Show final count
SELECT 'Final element count by program:' as info;
SELECT 
    p.name as program_name,
    COUNT(*) as element_count
FROM wbs_element we
JOIN program p ON p.id = we."programId"
GROUP BY p.id, p.name
ORDER BY p.name; 