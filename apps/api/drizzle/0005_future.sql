CREATE TABLE "future_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"title" text NOT NULL,
	"emoji" text,
	"note" text,
	"category" text DEFAULT 'dream' NOT NULL,
	"position" text NOT NULL,
	"created_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "future_title_len_ck" CHECK (length("future_items"."title") between 1 and 120),
	CONSTRAINT "future_completed_ck" CHECK (("future_items"."completed_at" is null) = ("future_items"."completed_by" is null))
);
--> statement-breakpoint
ALTER TABLE "future_items" ADD CONSTRAINT "future_items_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future_items" ADD CONSTRAINT "future_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "future_items" ADD CONSTRAINT "future_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "future_items_space_id_position_index" ON "future_items" USING btree ("space_id","position") WHERE "future_items"."deleted_at" is null;