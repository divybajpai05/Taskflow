CREATE TABLE `activity_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`workspace_id` varchar(36),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50),
	`entity_id` varchar(36),
	`details` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`user_id` varchar(36) NOT NULL,
	`date` timestamp NOT NULL,
	`status` enum('PRESENT','LATE','ABSENT','HALF_DAY','ON_LEAVE') NOT NULL,
	`marked_by_id` varchar(36),
	`notes` text,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`),
	CONSTRAINT `attendance_user_date_unique` UNIQUE(`user_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`name` varchar(100) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`is_system` boolean DEFAULT false,
	`created_by_id` varchar(36),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaves` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`user_id` varchar(36) NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`type` enum('CASUAL','SICK','EARNED','UNPAID') NOT NULL,
	`status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
	`reason` text,
	`approved_by_id` varchar(36),
	CONSTRAINT `leaves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`name` varchar(100) NOT NULL,
	`description` text,
	`module` varchar(50),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	CONSTRAINT `role_permissions_role_id_permission_id_pk` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`name` varchar(100) NOT NULL,
	`description` text,
	`is_system` boolean DEFAULT false,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('TODO','IN_PROGRESS','REVIEW','DONE','CANCELLED') DEFAULT 'TODO',
	`priority` enum('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
	`due_date` timestamp,
	`workspace_id` varchar(36) NOT NULL,
	`team_id` varchar(36),
	`assignee_id` varchar(36),
	`created_by_id` varchar(36) NOT NULL,
	`updated_by_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`name` varchar(150) NOT NULL,
	`workspace_id` varchar(36) NOT NULL,
	`color` varchar(20),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`user_id` varchar(36) NOT NULL,
	`permission_id` varchar(36) NOT NULL,
	`granted` boolean DEFAULT true,
	CONSTRAINT `user_permissions_user_id_permission_id_pk` PRIMARY KEY(`user_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`email` varchar(255) NOT NULL,
	`name` varchar(150) NOT NULL,
	`phone` varchar(20),
	`password` text NOT NULL,
	`email_verified` boolean DEFAULT false,
	`email_verification_token` varchar(255),
	`email_verification_expires` timestamp,
	`password_reset_token` varchar(255),
	`password_reset_expires` timestamp,
	`refresh_token` text,
	`last_login_at` timestamp,
	`last_login_ip` varchar(45),
	`avatar` varchar(500),
	`role_id` varchar(36) NOT NULL,
	`workspace_id` varchar(36) NOT NULL,
	`team` varchar(100),
	`team_id` varchar(36),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` varchar(36) NOT NULL DEFAULT UUID(),
	`name` varchar(255) NOT NULL,
	`description` text,
	`owner_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_marked_by_id_users_id_fk` FOREIGN KEY (`marked_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_templates` ADD CONSTRAINT `email_templates_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaves` ADD CONSTRAINT `leaves_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaves` ADD CONSTRAINT `leaves_approved_by_id_users_id_fk` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_updated_by_id_users_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_user_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `activity_workspace_idx` ON `activity_logs` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `activity_created_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `tasks_workspace_idx` ON `tasks` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `tasks_assignee_idx` ON `tasks` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);