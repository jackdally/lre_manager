-- Create cost_category table
CREATE TABLE IF NOT EXISTS cost_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Insert default cost categories
INSERT INTO cost_category (code, name, description, is_active) VALUES
('LABOR', 'Labor', 'Direct labor costs including salaries, wages, and benefits', true),
('MATERIALS', 'Materials', 'Direct materials and supplies', true),
('EQUIPMENT', 'Equipment', 'Equipment rental, maintenance, and depreciation', true),
('SUBCONTRACTOR', 'Subcontractor', 'Subcontractor and consultant costs', true),
('TRAVEL', 'Travel', 'Travel expenses including airfare, lodging, and meals', true),
('OVERHEAD', 'Overhead', 'Indirect costs and overhead allocation', true),
('G&A', 'General & Administrative', 'General and administrative expenses', true),
('FEE', 'Fee', 'Profit and fee markup', true),
('OTHER', 'Other', 'Other miscellaneous costs', true)
ON CONFLICT (code) DO NOTHING;

-- Add cost_category_id column to ledger_entry table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ledger_entry' AND column_name = 'cost_category_id') THEN
        ALTER TABLE ledger_entry ADD COLUMN cost_category_id UUID;
        ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_entry_cost_category 
            FOREIGN KEY (cost_category_id) REFERENCES cost_category(id) ON DELETE SET NULL;
    END IF;
END $$; 