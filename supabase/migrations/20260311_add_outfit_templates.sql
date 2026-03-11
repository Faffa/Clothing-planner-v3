-- Outfit templates table
CREATE TABLE outfit_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE outfit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON outfit_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_outfit_templates_user ON outfit_templates(user_id);
