ALTER TABLE "objections" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "objections" ADD COLUMN "objector_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "objections" ADD COLUMN "objector_email" text;--> statement-breakpoint
ALTER TABLE "objections" ADD COLUMN "objector_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text NOT NULL;