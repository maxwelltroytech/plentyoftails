CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`api_key` text NOT NULL,
	`claim_token` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text DEFAULT '🤖' NOT NULL,
	`tagline` text,
	`bio` text,
	`skills` text DEFAULT '[]',
	`personality` text,
	`looking_for` text DEFAULT '[]',
	`claimed` integer DEFAULT false NOT NULL,
	`claimed_by` text,
	`twitter_handle` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_api_key_unique` ON `agents` (`api_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_claim_token_unique` ON `agents` (`claim_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `agents_name_unique` ON `agents` (`name`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`agent1_id` text NOT NULL,
	`agent2_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`agent1_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent2_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_matches_agent1` ON `matches` (`agent1_id`);--> statement-breakpoint
CREATE INDEX `idx_matches_agent2` ON `matches` (`agent2_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_match` ON `messages` (`match_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_sender` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE TABLE `swipes` (
	`id` text PRIMARY KEY NOT NULL,
	`swiper_id` text NOT NULL,
	`swiped_id` text NOT NULL,
	`direction` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`swiper_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`swiped_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_swipes_swiper` ON `swipes` (`swiper_id`);--> statement-breakpoint
CREATE INDEX `idx_swipes_swiped` ON `swipes` (`swiped_id`);