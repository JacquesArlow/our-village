CREATE TABLE `form_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`event_title` text,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_mime` text NOT NULL,
	`file_size` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `event` ADD `form_file_name` text;--> statement-breakpoint
ALTER TABLE `event` ADD `form_file_path` text;--> statement-breakpoint
ALTER TABLE `event` ADD `form_file_mime` text;--> statement-breakpoint
ALTER TABLE `event` ADD `form_file_size` integer;--> statement-breakpoint
ALTER TABLE `event` ADD `form_uploaded_at` integer;