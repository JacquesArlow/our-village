CREATE TABLE `booking` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`event_title` text,
	`name` text NOT NULL,
	`surname` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`message` text,
	`created_at` integer NOT NULL
);
