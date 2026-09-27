CREATE TABLE "journal_blocks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "journal_blocks_id_space_uq" UNIQUE("id","space_id")
);
--> statement-breakpoint
CREATE TABLE "journal_pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"page_date" date NOT NULL,
	"title" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "journal_pages_id_space_uq" UNIQUE("id","space_id")
);
--> statement-breakpoint
CREATE TABLE "journal_reactions" (
	"page_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_reactions_page_id_user_id_pk" PRIMARY KEY("page_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"space_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"block_id" uuid,
	"position" smallint DEFAULT 0 NOT NULL,
	"storage_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"caption" text,
	"taken_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_blocks" ADD CONSTRAINT "journal_blocks_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_blocks" ADD CONSTRAINT "journal_blocks_page_id_space_id_journal_pages_id_space_id_fk" FOREIGN KEY ("page_id","space_id") REFERENCES "public"."journal_pages"("id","space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_pages" ADD CONSTRAINT "journal_pages_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_pages" ADD CONSTRAINT "journal_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_reactions" ADD CONSTRAINT "journal_reactions_page_id_space_id_journal_pages_id_space_id_fk" FOREIGN KEY ("page_id","space_id") REFERENCES "public"."journal_pages"("id","space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_block_id_space_id_journal_blocks_id_space_id_fk" FOREIGN KEY ("block_id","space_id") REFERENCES "public"."journal_blocks"("id","space_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_blocks_page_id_created_at_index" ON "journal_blocks" USING btree ("page_id","created_at");--> statement-breakpoint
CREATE INDEX "journal_pages_space_id_page_date_created_at_index" ON "journal_pages" USING btree ("space_id","page_date" DESC NULLS LAST,"created_at" DESC NULLS LAST) WHERE "journal_pages"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "media_space_id_created_at_index" ON "media" USING btree ("space_id","created_at" DESC NULLS LAST) WHERE "media"."status" = 'ready';--> statement-breakpoint
CREATE INDEX "media_block_id_position_index" ON "media" USING btree ("block_id","position");