CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_users_email` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`business_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`buyer_type` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`state` text NOT NULL,
	`city` text NOT NULL,
	`pincode` text NOT NULL,
	`note` text,
	`consented_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`internal_notes` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_enquiries_status_created` ON `enquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_enquiries_expires_at` ON `enquiries` (`expires_at`);--> statement-breakpoint
CREATE TABLE `enquiry_items` (
	`id` text PRIMARY KEY NOT NULL,
	`enquiry_id` text NOT NULL,
	`product_id` text,
	`product_slug` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`note` text,
	FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_enquiry_items_enquiry` ON `enquiry_items` (`enquiry_id`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`object_key` text,
	`src` text NOT NULL,
	`alt` text NOT NULL,
	`reference_note` text DEFAULT '' NOT NULL,
	`source_label` text DEFAULT 'Business-supplied image' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`credit` text DEFAULT '' NOT NULL,
	`license_label` text DEFAULT 'Business supplied' NOT NULL,
	`license_url` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_images_product_order` ON `product_images` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`generic_name` text NOT NULL,
	`brand_name` text,
	`composition` text NOT NULL,
	`category` text NOT NULL,
	`dosage_form` text NOT NULL,
	`strength` text NOT NULL,
	`pack_size` text NOT NULL,
	`manufacturer` text NOT NULL,
	`regulatory_classification` text NOT NULL,
	`trade_notes` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_demo` integer DEFAULT true NOT NULL,
	`public_approved` integer DEFAULT false NOT NULL,
	`price_display` text DEFAULT 'indicative' NOT NULL,
	`price_value` text,
	`price_unit` text,
	`price_checked_on` text,
	`price_sources_json` text DEFAULT '[]' NOT NULL,
	`availability` text DEFAULT 'on_request' NOT NULL,
	`minimum_quantity` integer DEFAULT 1 NOT NULL,
	`enquiry_eligible` integer DEFAULT true NOT NULL,
	`seo_enabled` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_products_public_status` ON `products` (`status`,`is_demo`,`seo_enabled`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`brand_name` text NOT NULL,
	`legal_name` text NOT NULL,
	`identity_status` text NOT NULL,
	`address` text NOT NULL,
	`map_url` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`whatsapp_number` text NOT NULL,
	`licence_references_json` text DEFAULT '[]' NOT NULL,
	`business_hours` text NOT NULL,
	`homepage_headline` text NOT NULL,
	`homepage_intro` text NOT NULL,
	`primary_state` text DEFAULT 'Gujarat' NOT NULL,
	`service_message` text NOT NULL,
	`disclaimer` text NOT NULL,
	`indexing_mode` text DEFAULT 'preview' NOT NULL,
	`identity_verified` integer DEFAULT false NOT NULL,
	`contacts_verified` integer DEFAULT false NOT NULL,
	`licences_verified` integer DEFAULT false NOT NULL,
	`privacy_acknowledged` integer DEFAULT false NOT NULL,
	`disclaimer_acknowledged` integer DEFAULT false NOT NULL,
	`advertising_acknowledged` integer DEFAULT false NOT NULL,
	`legal_review_acknowledged` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
