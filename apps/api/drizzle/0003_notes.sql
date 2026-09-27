CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"body" text NOT NULL,
	"paper" text DEFAULT 'cream' NOT NULL,
	"unlock_at" timestamp with time zone,
	"unlock_label" text,
	"opened_at" timestamp with time zone,
	"reacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "notes_body_len_ck" CHECK (length("notes"."body") between 1 and 500),
	CONSTRAINT "notes_not_self_ck" CHECK ("notes"."author_id" <> "notes"."recipient_id")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notes_space_id_created_at_index" ON "notes" USING btree ("space_id","created_at" DESC NULLS LAST) WHERE "notes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "notes_waiting_idx" ON "notes" USING btree ("space_id","recipient_id") WHERE "notes"."opened_at" is null and "notes"."deleted_at" is null;