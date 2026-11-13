ALTER TABLE pets ADD COLUMN IF NOT EXISTS decision_id uuid;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_decision_ck;
ALTER TABLE pets ADD CONSTRAINT pets_decision_ck CHECK ((decision_id IS NULL) = (proposed_enabled IS NULL));
