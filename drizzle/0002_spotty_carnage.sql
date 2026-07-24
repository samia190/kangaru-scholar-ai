CREATE TABLE `lessonPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`grade` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revisionMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`curriculum` enum('8-4-4','CBE') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `revisionMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timetables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timetables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lessonPlans` ADD CONSTRAINT `lessonPlans_teacherId_users_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timetables` ADD CONSTRAINT `timetables_teacherId_users_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;