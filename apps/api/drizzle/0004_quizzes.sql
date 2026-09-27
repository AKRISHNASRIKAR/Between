CREATE TABLE "quiz_answers" (
	"session_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"choice" text,
	"guess" text,
	"who_user_id" uuid,
	"text_answer" text,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_answers_session_id_question_id_user_id_pk" PRIMARY KEY("session_id","question_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quiz_packs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quiz_participants" (
	"session_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"reveal_seen_at" timestamp with time zone,
	CONSTRAINT "quiz_participants_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"pack_id" uuid,
	"kind" text NOT NULL,
	"prompt_self" text NOT NULL,
	"prompt_guess" text,
	"options" jsonb,
	"position" integer DEFAULT 0 NOT NULL,
	"is_daily" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	CONSTRAINT "quiz_questions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"pack_id" uuid,
	"kind" text NOT NULL,
	"question_ids" uuid[] NOT NULL,
	"daily_date" date,
	"started_by" uuid NOT NULL,
	"ready_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_sessions_id_space_uq" UNIQUE("id","space_id")
);
--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_session_id_space_id_quiz_sessions_id_space_id_fk" FOREIGN KEY ("session_id","space_id") REFERENCES "public"."quiz_sessions"("id","space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_participants" ADD CONSTRAINT "quiz_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_participants" ADD CONSTRAINT "quiz_participants_session_id_space_id_quiz_sessions_id_space_id_fk" FOREIGN KEY ("session_id","space_id") REFERENCES "public"."quiz_sessions"("id","space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_pack_id_quiz_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."quiz_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_pack_id_quiz_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."quiz_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_questions_pack_id_position_index" ON "quiz_questions" USING btree ("pack_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "one_daily_per_day" ON "quiz_sessions" USING btree ("space_id","daily_date") WHERE "quiz_sessions"."kind" = 'daily';--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_pack" ON "quiz_sessions" USING btree ("space_id","pack_id") WHERE "quiz_sessions"."kind" = 'pack' and "quiz_sessions"."ready_at" is null;--> statement-breakpoint
CREATE INDEX "quiz_sessions_space_id_created_at_index" ON "quiz_sessions" USING btree ("space_id","created_at" DESC NULLS LAST);