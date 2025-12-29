ALTER TABLE `users` MODIFY COLUMN `subscriptionPlan` enum('free','professional','enterprise') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);