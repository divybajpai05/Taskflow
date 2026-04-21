ALTER TABLE `attendance` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `email_templates` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `leaves` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `permissions` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `roles` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `teams` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `workspaces` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());