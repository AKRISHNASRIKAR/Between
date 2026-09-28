ALTER TABLE "spaces" DROP CONSTRAINT "spaces_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;