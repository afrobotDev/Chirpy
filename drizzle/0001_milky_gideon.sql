CREATE TABLE "chirps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
  "createdAt" timestamp DEFAULT now () NOT NULL,
  "updatedAt" timestamp DEFAULT now () NOT NULL,
  "body" varchar NOT NULL,
  "userId" uuid NOT NULL
);

--> statement-breakpoint
ALTER TABLE "chirps"
ADD CONSTRAINT "custom_fk" FOREIGN KEY ("userId") REFERENCES "public"."users" ("id") ON DELETE cascade ON UPDATE no action;

