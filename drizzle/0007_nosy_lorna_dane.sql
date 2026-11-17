CREATE TABLE `media_objects` (
	`object_key` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`data` blob NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_media_objects_product` ON `media_objects` (`product_id`);