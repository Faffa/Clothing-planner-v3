-- Add per-item rule override column
ALTER TABLE clothing_items ADD COLUMN rule_override jsonb DEFAULT null;

-- Comment for clarity
COMMENT ON COLUMN clothing_items.rule_override IS 'Per-item wearing rule override: { max_per_week?: number, allow_consecutive?: boolean }. Null means inherit from global layer rules.';
