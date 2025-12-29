ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `whatsappEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `telegramChatId` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `telegramEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationQuietStart` varchar(5);--> statement-breakpoint
ALTER TABLE `users` ADD `notificationQuietEnd` varchar(5);