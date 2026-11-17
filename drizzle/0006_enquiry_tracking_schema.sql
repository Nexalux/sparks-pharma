CREATE TABLE `enquiry_status_events` (
	`id` text PRIMARY KEY NOT NULL,
	`enquiry_id` text NOT NULL,
	`status` text NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_enquiry_status_events_enquiry_created` ON `enquiry_status_events` (`enquiry_id`,`created_at`);
--> statement-breakpoint
INSERT INTO `enquiry_status_events` (`id`, `enquiry_id`, `status`, `message`, `created_at`)
SELECT
	lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
	`id`,
	`status`,
	CASE `status`
		WHEN 'new' THEN 'Enquiry received and queued for review.'
		WHEN 'contacted' THEN 'Buyer contact has started.'
		WHEN 'qualified' THEN 'Requirements are under detailed review.'
		WHEN 'closed' THEN 'Enquiry follow-up has been completed.'
		ELSE 'Enquiry status updated.'
	END,
	`created_at`
FROM `enquiries`;
