ALTER TABLE "notes" DROP CONSTRAINT "notes_recipient_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "recipient_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;