CREATE TABLE "refresh_tokens" (
	"token" varchar PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"revokedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;