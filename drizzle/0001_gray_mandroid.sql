CREATE TABLE `brazilian_holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`name` varchar(255) NOT NULL,
	`scope` enum('national','state','municipal','judicial') NOT NULL,
	`state` varchar(2),
	`city` varchar(100),
	`court` varchar(100),
	`year` int NOT NULL,
	CONSTRAINT `brazilian_holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`caseNumber` varchar(50),
	`category` enum('civil','trabalhista','criminal','tributario','familia','consumidor','previdenciario','administrativo','empresarial','outro') NOT NULL,
	`jurisdiction` varchar(100) NOT NULL,
	`court` varchar(200),
	`description` text NOT NULL,
	`arguments` text,
	`clientName` varchar(255),
	`opposingParty` varchar(255),
	`status` enum('active','archived','closed','won','lost') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deadlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`deadlineType` enum('contestacao','recurso','manifestacao','audiencia','pericia','cumprimento','embargo','outro') NOT NULL,
	`publicationDate` timestamp,
	`startDate` timestamp NOT NULL,
	`dueDate` timestamp NOT NULL,
	`calculatedDueDate` timestamp,
	`daysCount` int,
	`isBusinessDays` boolean NOT NULL DEFAULT true,
	`confidenceScore` decimal(5,2),
	`status` enum('pending','completed','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`alert7Days` boolean NOT NULL DEFAULT false,
	`alert3Days` boolean NOT NULL DEFAULT false,
	`alert1Day` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deadlines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`hearingId` int,
	`title` varchar(255) NOT NULL,
	`documentType` enum('peticao','contestacao','recurso','evidencia','contrato','procuracao','transcricao','minuta','outro') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hearing_minutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hearingId` int NOT NULL,
	`userId` int NOT NULL,
	`transcriptionId` int,
	`executiveSummary` text NOT NULL,
	`keyPoints` json NOT NULL,
	`petitionDraft` text,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hearing_minutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hearing_simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`judgeQuestions` json NOT NULL,
	`opposingQuestions` json NOT NULL,
	`objectionPoints` json NOT NULL,
	`strategicNotes` text,
	`predictedTemperament` enum('conciliatory','technical','contentious','neutral'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hearing_simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hearings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`hearingType` enum('conciliacao','instrucao','julgamento','inicial','una','outro') NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`location` varchar(255),
	`isVirtual` boolean NOT NULL DEFAULT false,
	`virtualLink` varchar(500),
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hearings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`notificationType` enum('deadline_alert','hearing_reminder','analysis_complete','system','subscription') NOT NULL,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictive_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`successProbability` decimal(5,2) NOT NULL,
	`reasoning` text NOT NULL,
	`strengths` json NOT NULL,
	`weaknesses` json NOT NULL,
	`risks` json NOT NULL,
	`strategy` json NOT NULL,
	`estimatedDurationMonths` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictive_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text,
	`priceMonthly` decimal(10,2) NOT NULL,
	`priceYearly` decimal(10,2),
	`maxCases` int,
	`maxAnalysesPerMonth` int,
	`maxSimulationsPerMonth` int,
	`maxTranscriptionMinutes` int,
	`hasRealTimeAssistant` boolean NOT NULL DEFAULT false,
	`hasDatajudIntegration` boolean NOT NULL DEFAULT false,
	`hasEmailAlerts` boolean NOT NULL DEFAULT false,
	`hasPrioritySupport` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hearingId` int NOT NULL,
	`userId` int NOT NULL,
	`audioUrl` varchar(500),
	`audioFileKey` varchar(255),
	`transcriptionText` text,
	`segments` json,
	`language` varchar(10) DEFAULT 'pt',
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`featureType` enum('predictive_analysis','hearing_simulation','transcription','minute_generation','datajud_query') NOT NULL,
	`usageCount` int NOT NULL DEFAULT 1,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('free','basic','pro','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;