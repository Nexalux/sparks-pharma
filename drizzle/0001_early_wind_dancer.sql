CREATE TABLE `member_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_identities_provider_subject` ON `member_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `idx_member_identities_member` ON `member_identities` (`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`business_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`preferred_contact` text DEFAULT 'email' NOT NULL,
	`buyer_type` text DEFAULT '' NOT NULL,
	`state` text DEFAULT 'Gujarat' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`pincode` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_email` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `quote_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`items_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_quote_drafts_member_updated` ON `quote_drafts` (`member_id`,`updated_at`);--> statement-breakpoint
ALTER TABLE `enquiries` ADD `member_id` text REFERENCES members(id);--> statement-breakpoint
CREATE INDEX `idx_enquiries_member_created` ON `enquiries` (`member_id`,`created_at`);