CREATE TABLE `contributions` (
	`room_code` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`mission_id` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`room_code`, `user_id`),
	FOREIGN KEY (`room_code`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contribution_role_unique` ON `contributions` (`room_code`,`role`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`room_code` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`room_code`, `user_id`),
	FOREIGN KEY (`room_code`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_role_unique` ON `room_members` (`room_code`,`role`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
