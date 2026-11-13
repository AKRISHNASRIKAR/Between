ALTER TABLE spaces ADD COLUMN pet_setup_complete boolean NOT NULL DEFAULT false;
UPDATE spaces SET pet_setup_complete = true;
CREATE TABLE analytics_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
 name text NOT NULL,
 entity_id uuid,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_space_time_idx ON analytics_events(space_id, occurred_at);
CREATE UNIQUE INDEX analytics_entity_once_idx ON analytics_events(user_id, name, entity_id) WHERE entity_id IS NOT NULL;
