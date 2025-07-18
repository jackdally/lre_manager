-- Migration script to add hierarchical WBS structure
-- This script adds the new wbs_element table and updates ledger_entry to support both old and new structures

-- Create the new wbs_element table
CREATE TABLE IF NOT EXISTS wbs_element (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    level integer NOT NULL,
    "parentId" uuid,
    "programId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wbs_element_parent FOREIGN KEY ("parentId") REFERENCES wbs_element(id) ON DELETE CASCADE,
    CONSTRAINT fk_wbs_element_program FOREIGN KEY ("programId") REFERENCES program(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wbs_element_program_id ON wbs_element("programId");
CREATE INDEX IF NOT EXISTS idx_wbs_element_parent_id ON wbs_element("parentId");
CREATE INDEX IF NOT EXISTS idx_wbs_element_level ON wbs_element(level);
CREATE INDEX IF NOT EXISTS idx_wbs_element_code ON wbs_element(code);

-- Add the new wbs_element_id column to ledger_entry table
ALTER TABLE ledger_entry ADD COLUMN IF NOT EXISTS wbs_element_id uuid;
ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_entry_wbs_element 
    FOREIGN KEY (wbs_element_id) REFERENCES wbs_element(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_ledger_entry_wbs_element_id ON ledger_entry(wbs_element_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_wbs_element_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_wbs_element_updated_at
    BEFORE UPDATE ON wbs_element
    FOR EACH ROW
    EXECUTE FUNCTION update_wbs_element_updated_at();

-- Insert some sample hierarchical WBS elements for existing programs
-- This will create a basic structure that can be expanded later
-- Only insert if no WBS elements exist for the program to prevent duplicates
DO $$
DECLARE
    program_record RECORD;
    root_element_id uuid;
    child_element_id uuid;
    existing_count integer;
BEGIN
    FOR program_record IN SELECT id, code, name FROM program LOOP
        -- Check if WBS elements already exist for this program
        SELECT COUNT(*) INTO existing_count 
        FROM wbs_element 
        WHERE "programId" = program_record.id;
        
        -- Only create elements if none exist
        IF existing_count = 0 THEN
            -- Create root level elements (similar to the default WBS template)
            
            -- Project Management
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES (gen_random_uuid(), '1.0', 'Project Management', 'Project management and oversight activities', 1, NULL, program_record.id)
            RETURNING id INTO root_element_id;
            
            -- Add children to Project Management
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES 
                (gen_random_uuid(), '1.1', 'Planning', 'Project planning and scheduling', 2, root_element_id, program_record.id),
                (gen_random_uuid(), '1.2', 'Monitoring & Control', 'Project monitoring and control activities', 2, root_element_id, program_record.id);
            
            -- Technical Development
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES (gen_random_uuid(), '2.0', 'Technical Development', 'Technical development activities', 1, NULL, program_record.id)
            RETURNING id INTO root_element_id;
            
            -- Add children to Technical Development
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES 
                (gen_random_uuid(), '2.1', 'Design', 'System and component design', 2, root_element_id, program_record.id),
                (gen_random_uuid(), '2.2', 'Implementation', 'System implementation and coding', 2, root_element_id, program_record.id),
                (gen_random_uuid(), '2.3', 'Testing', 'System testing and validation', 2, root_element_id, program_record.id);
            
            -- Integration & Deployment
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES (gen_random_uuid(), '3.0', 'Integration & Deployment', 'System integration and deployment activities', 1, NULL, program_record.id)
            RETURNING id INTO root_element_id;
            
            -- Add children to Integration & Deployment
            INSERT INTO wbs_element (id, code, name, description, level, "parentId", "programId")
            VALUES 
                (gen_random_uuid(), '3.1', 'Integration', 'System integration activities', 2, root_element_id, program_record.id),
                (gen_random_uuid(), '3.2', 'Deployment', 'System deployment and delivery', 2, root_element_id, program_record.id);
        END IF;
    END LOOP;
END $$;

-- Update existing ledger entries to reference the new WBS elements
-- This creates a mapping from the old category/subcategory to the new hierarchical structure
UPDATE ledger_entry 
SET wbs_element_id = (
    SELECT we.id 
    FROM wbs_element we 
    WHERE we."programId" = ledger_entry."programId" 
    AND we.name = ledger_entry.wbs_subcategory
    LIMIT 1
)
WHERE wbs_element_id IS NULL;

-- Add a comment to document the migration
COMMENT ON TABLE wbs_element IS 'Hierarchical WBS structure supporting unlimited depth levels';
COMMENT ON COLUMN ledger_entry.wbs_element_id IS 'Reference to hierarchical WBS element (new structure)';
COMMENT ON COLUMN ledger_entry.wbs_category IS 'Legacy field - use wbs_element_id for new entries';
COMMENT ON COLUMN ledger_entry.wbs_subcategory IS 'Legacy field - use wbs_element_id for new entries'; 