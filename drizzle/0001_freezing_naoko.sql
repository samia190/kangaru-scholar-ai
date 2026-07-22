CREATE TABLE `chatHistories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`portalType` enum('guest','student','teacher') NOT NULL,
	`messages` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatHistories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chatHistories` ADD CONSTRAINT `chatHistories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;