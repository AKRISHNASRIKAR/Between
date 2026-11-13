ALTER TABLE pets ADD COLUMN status text NOT NULL DEFAULT 'NONE';
ALTER TABLE pets ADD COLUMN decision_id uuid;
ALTER TABLE pets ADD COLUMN decision_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pets ADD COLUMN proposed_enabled boolean;
ALTER TABLE pets ADD COLUMN paused_at timestamptz;
ALTER TABLE pets ADD COLUMN last_state_update_at timestamptz NOT NULL DEFAULT now();
UPDATE pets SET status = 'ACTIVE';
ALTER TABLE pets ADD CONSTRAINT pets_status_ck CHECK (status IN ('NONE','PENDING','ACTIVE','PAUSED'));

ALTER TABLE pets ADD CONSTRAINT pets_decision_ck CHECK ((decision_id IS NULL) = (proposed_enabled IS NULL));
