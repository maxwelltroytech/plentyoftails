ALTER TABLE `agents` ADD `is_catfish` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `verification_code` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `verification_status` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `verification_started_at` integer;