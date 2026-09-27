CREATE TABLE "notification_prefs" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"notes" boolean DEFAULT true NOT NULL,
	"vibes" boolean DEFAULT true NOT NULL,
	"quizzes" boolean DEFAULT true NOT NULL,
	"journal" boolean DEFAULT true NOT NULL,
	"future" boolean DEFAULT true NOT NULL,
	"pet_greeting" boolean DEFAULT false NOT NULL,
	"quiet_start" time,
	"quiet_end" time
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mood_checkins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"mood" text NOT NULL,
	"note" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"shared_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mood_one_per_day" UNIQUE("space_id","user_id","local_date"),
	CONSTRAINT "mood_visibility_ck" CHECK (("mood_checkins"."visibility" = 'shared') = ("mood_checkins"."shared_at" is not null)),
	CONSTRAINT "mood_note_len_ck" CHECK ("mood_checkins"."note" is null or length("mood_checkins"."note") <= 140)
);
--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_checkins" ADD CONSTRAINT "mood_checkins_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_checkins" ADD CONSTRAINT "mood_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_tokens_user_id_index" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mood_checkins_space_id_local_date_index" ON "mood_checkins" USING btree ("space_id","local_date" DESC NULLS LAST);