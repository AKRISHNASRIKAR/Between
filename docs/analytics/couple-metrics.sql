-- Read-only product metrics. Run against the deployed database after migrations.
-- A meaningful contribution excludes private mood checks, app opens, and pet care.
WITH contributions AS (
  SELECT e.*, (e.occurred_at AT TIME ZONE s.timezone)::date AS day
  FROM analytics_events e JOIN spaces s ON s.id = e.space_id
  WHERE e.name IN ('note_created','mood_shared','quiz_completed','journal_entry_created','memory_added','future_item_completed')
), first_by_member AS (
  SELECT space_id, user_id, min(day) AS first_day FROM contributions GROUP BY space_id, user_id
), activated AS (
  SELECT space_id, max(first_day) AS activation_day FROM first_by_member
  GROUP BY space_id HAVING count(DISTINCT user_id) = 2
), active_days AS (
  SELECT space_id, day, count(*) AS moments, count(DISTINCT user_id) AS contributors
  FROM contributions GROUP BY space_id, day
)
SELECT count(DISTINCT a.space_id) AS activated_couples,
  count(DISTINCT a.space_id) FILTER (WHERE d.day = a.activation_day + 1)::numeric / nullif(count(DISTINCT a.space_id) FILTER (WHERE a.activation_day <= current_date - 1), 0) AS d1,
  count(DISTINCT a.space_id) FILTER (WHERE d.day = a.activation_day + 7)::numeric / nullif(count(DISTINCT a.space_id) FILTER (WHERE a.activation_day <= current_date - 7), 0) AS d7,
  count(DISTINCT a.space_id) FILTER (WHERE d.day = a.activation_day + 30)::numeric / nullif(count(DISTINCT a.space_id) FILTER (WHERE a.activation_day <= current_date - 30), 0) AS d30,
  sum(d.moments) FILTER (WHERE d.day >= current_date - 6)::numeric / nullif(count(DISTINCT d.space_id) FILTER (WHERE d.day >= current_date - 6), 0) AS weekly_moments_per_active_couple,
  count(*) FILTER (WHERE d.contributors = 2 AND d.day >= current_date - 6)::numeric / nullif(count(*) FILTER (WHERE d.day >= current_date - 6), 0) AS reciprocal_active_day_share
FROM activated a LEFT JOIN active_days d ON d.space_id = a.space_id;

-- Adoption counts are event-based. iOS widget installation is not observable in the
-- installed Expo API; widget_opened is an observed-use proxy, never an installation count.
SELECT name, count(DISTINCT space_id) AS adopting_couples, count(*) AS successful_events
FROM analytics_events WHERE space_id IS NOT NULL
GROUP BY name ORDER BY name;
