-- Reset WBS Templates to Default
-- This script deletes all existing WBS templates and inserts the default template

-- First, delete all existing WBS template elements (due to foreign key constraints)
DELETE FROM wbs_template_element;

-- Then delete all existing WBS templates
DELETE FROM wbs_template;

-- Insert the default "Standard Project WBS" template
INSERT INTO wbs_template (id, name, description, "isDefault", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'Standard Project WBS',
  'A standard work breakdown structure for typical projects',
  true,
  NOW(),
  NOW()
);

-- Get the template ID for use in elements
DO $$
DECLARE
    template_id uuid;
BEGIN
    SELECT id INTO template_id FROM wbs_template WHERE name = 'Standard Project WBS' LIMIT 1;
    
    -- Insert the WBS elements for the default template
    -- Level 1: Project Management
    INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
    VALUES (gen_random_uuid(), '1.0', 'Project Management', 'Project management and oversight activities', 1, NULL, template_id);
    
    -- Get the Project Management element ID
    DECLARE
        pm_id uuid;
    BEGIN
        SELECT id INTO pm_id FROM wbs_template_element WHERE code = '1.0' AND "templateId" = template_id LIMIT 1;
        
        -- Level 2: Planning (child of Project Management)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '1.1', 'Planning', 'Project planning and scheduling', 2, pm_id, template_id);
        
        -- Level 2: Monitoring & Control (child of Project Management)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '1.2', 'Monitoring & Control', 'Project monitoring and control activities', 2, pm_id, template_id);
    END;
    
    -- Level 1: Technical Development
    INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
    VALUES (gen_random_uuid(), '2.0', 'Technical Development', 'Technical development and implementation', 1, NULL, template_id);
    
    -- Get the Technical Development element ID
    DECLARE
        td_id uuid;
    BEGIN
        SELECT id INTO td_id FROM wbs_template_element WHERE code = '2.0' AND "templateId" = template_id LIMIT 1;
        
        -- Level 2: Design (child of Technical Development)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '2.1', 'Design', 'System design and architecture', 2, td_id, template_id);
        
        -- Level 2: Implementation (child of Technical Development)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '2.2', 'Implementation', 'System implementation and coding', 2, td_id, template_id);
        
        -- Level 2: Testing (child of Technical Development)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '2.3', 'Testing', 'System testing and validation', 2, td_id, template_id);
    END;
    
    -- Level 1: Integration & Deployment
    INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
    VALUES (gen_random_uuid(), '3.0', 'Integration & Deployment', 'System integration and deployment activities', 1, NULL, template_id);
    
    -- Get the Integration & Deployment element ID
    DECLARE
        id_id uuid;
    BEGIN
        SELECT id INTO id_id FROM wbs_template_element WHERE code = '3.0' AND "templateId" = template_id LIMIT 1;
        
        -- Level 2: Integration (child of Integration & Deployment)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '3.1', 'Integration', 'System integration activities', 2, id_id, template_id);
        
        -- Level 2: Deployment (child of Integration & Deployment)
        INSERT INTO wbs_template_element (id, code, name, description, level, "parentId", "templateId") 
        VALUES (gen_random_uuid(), '3.2', 'Deployment', 'System deployment and go-live', 2, id_id, template_id);
    END;
END $$;

-- Verify the insertion
SELECT 'WBS Templates reset successfully!' as status; 