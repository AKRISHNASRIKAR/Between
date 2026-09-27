-- Backstop for the service-level rule: at most 2 active members per space.
CREATE OR REPLACE FUNCTION enforce_space_member_limit() RETURNS trigger AS $$
BEGIN
  IF NEW.left_at IS NULL AND (
    SELECT count(*) FROM space_members WHERE space_id = NEW.space_id AND left_at IS NULL
  ) >= 2 THEN
    RAISE EXCEPTION 'space % is full', NEW.space_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER space_member_limit BEFORE INSERT ON space_members
  FOR EACH ROW EXECUTE FUNCTION enforce_space_member_limit();
