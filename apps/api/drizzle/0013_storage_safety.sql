ALTER TABLE media ADD COLUMN thumb_bytes integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE storage_deletion_jobs (
  prefix text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
