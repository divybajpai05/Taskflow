ALTER TABLE `users` MODIFY COLUMN `email_verification_token` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password_reset_token` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `workspace_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `leaves` ADD `workspace_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaves` ADD CONSTRAINT `leaves_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;