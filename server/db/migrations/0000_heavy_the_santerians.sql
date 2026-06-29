CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`title` text NOT NULL,
	`detail` text,
	`staff` text,
	`color` text DEFAULT 'default' NOT NULL,
	`is_highlight` integer DEFAULT false NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `month_block` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`section` text NOT NULL,
	`text` text NOT NULL,
	`color` text DEFAULT 'default' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
