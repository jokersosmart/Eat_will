CREATE TABLE `conversation_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stage` enum('破冰','探索','推進','成交','關係') NOT NULL,
	`layer` int NOT NULL,
	`coreFocus` varchar(128) NOT NULL,
	`topicGuidance` text NOT NULL,
	`cautions` text NOT NULL,
	`sortOrder` int NOT NULL,
	CONSTRAINT `conversation_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dinner_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`guestCount` varchar(32) NOT NULL,
	`cuisine` varchar(64) NOT NULL,
	`timeSlot` varchar(64) NOT NULL,
	`objective` text NOT NULL,
	`stage` enum('破冰','探索','推進','成交','關係') NOT NULL,
	`layer` int NOT NULL,
	`context` text,
	`aiAdvice` text,
	`reflection` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dinner_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dinner_roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`definition` text NOT NULL,
	`signals` text NOT NULL,
	`strategy` text NOT NULL,
	`notes` text NOT NULL,
	`sortOrder` int NOT NULL,
	CONSTRAINT `dinner_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `dinner_roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`peopleTags` text NOT NULL,
	`cuisineTags` text NOT NULL,
	`timeTags` text NOT NULL,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultGuestCount` varchar(32),
	`defaultCuisine` varchar(64),
	`defaultTimeSlot` varchar(64),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `conversation_stages_stage_idx` ON `conversation_stages` (`stage`);--> statement-breakpoint
CREATE INDEX `dinner_records_user_created_idx` ON `dinner_records` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `knowledge_entries_section_idx` ON `knowledge_entries` (`section`);--> statement-breakpoint
CREATE INDEX `knowledge_entries_category_idx` ON `knowledge_entries` (`category`);