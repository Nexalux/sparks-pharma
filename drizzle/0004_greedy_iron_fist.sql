DROP INDEX `idx_auth_account_provider`;--> statement-breakpoint
ALTER TABLE `account` ADD `issuer` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_account_issuer` ON `account` (`issuer`,`accountId`);