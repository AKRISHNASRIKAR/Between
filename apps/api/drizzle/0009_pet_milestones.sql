CREATE TABLE "pet_milestones" (
	"pet_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"by_user_id" uuid,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_milestones_pet_id_kind_pk" PRIMARY KEY("pet_id","kind")
);
--> statement-breakpoint
ALTER TABLE "pets" ADD COLUMN "last_update_push_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pet_milestones" ADD CONSTRAINT "pet_milestones_by_user_id_users_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_milestones" ADD CONSTRAINT "pet_milestones_pet_id_space_id_pets_id_space_id_fk" FOREIGN KEY ("pet_id","space_id") REFERENCES "public"."pets"("id","space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pet_milestones_space_id_earned_at_index" ON "pet_milestones" USING btree ("space_id","earned_at" DESC NULLS LAST);