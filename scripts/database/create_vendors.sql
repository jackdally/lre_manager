-- Create vendor table
CREATE TABLE IF NOT EXISTS vendor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_name ON vendor(name);
CREATE INDEX IF NOT EXISTS idx_vendor_is_active ON vendor(is_active);

-- Add vendor_id column to ledger_entry table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ledger_entry' AND column_name = 'vendor_id') THEN
        ALTER TABLE ledger_entry ADD COLUMN vendor_id UUID;
        ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_entry_vendor 
            FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_ledger_entry_vendor_id ON ledger_entry(vendor_id);
    END IF;
END $$;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_vendor_updated_at
    BEFORE UPDATE ON vendor
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_updated_at(); 