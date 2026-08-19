CREATE TABLE `controls` (
	`id` varchar(128) NOT NULL,
	`framework` enum('cis-aws','cis-azure','cis-k8s') NOT NULL,
	`provider` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`defaultSeverity` enum('critical','high','medium','low') NOT NULL,
	`currentStatus` enum('pass','fail') NOT NULL,
	`lastEvaluatedAt` timestamp NOT NULL,
	CONSTRAINT `controls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drift_events` (
	`id` varchar(96) NOT NULL,
	`scanId` varchar(64) NOT NULL,
	`findingFingerprint` varchar(128) NOT NULL,
	`controlId` varchar(128) NOT NULL,
	`scanner` varchar(64) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`eventType` enum('new','resolved','regressed') NOT NULL,
	`occurredAt` timestamp NOT NULL,
	CONSTRAINT `drift_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finding_observations` (
	`id` varchar(64) NOT NULL,
	`scanId` varchar(64) NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`controlId` varchar(128) NOT NULL,
	`scanner` varchar(64) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`riskScore` int NOT NULL,
	`status` enum('open','resolved') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`resourceUrn` varchar(512) NOT NULL,
	`resourceName` varchar(255) NOT NULL,
	`resourceType` varchar(128) NOT NULL,
	`account` varchar(128) NOT NULL,
	`region` varchar(64) NOT NULL,
	`remediation` text NOT NULL,
	`firstSeenAt` timestamp NOT NULL,
	`lastSeenAt` timestamp NOT NULL,
	`observedAt` timestamp NOT NULL,
	CONSTRAINT `finding_observations_id` PRIMARY KEY(`id`),
	CONSTRAINT `finding_observations_scan_fingerprint_idx` UNIQUE(`scanId`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `scan_runs` (
	`id` varchar(64) NOT NULL,
	`scanner` varchar(64) NOT NULL,
	`scannerVersion` varchar(32) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`scopeKey` varchar(160) NOT NULL,
	`status` enum('complete','completed_with_errors') NOT NULL,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp NOT NULL,
	`checksRun` int NOT NULL,
	`findingCount` int NOT NULL,
	`errorCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `scan_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drift_events` ADD CONSTRAINT `drift_events_scanId_scan_runs_id_fk` FOREIGN KEY (`scanId`) REFERENCES `scan_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drift_events` ADD CONSTRAINT `drift_events_controlId_controls_id_fk` FOREIGN KEY (`controlId`) REFERENCES `controls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finding_observations` ADD CONSTRAINT `finding_observations_scanId_scan_runs_id_fk` FOREIGN KEY (`scanId`) REFERENCES `scan_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `finding_observations` ADD CONSTRAINT `finding_observations_controlId_controls_id_fk` FOREIGN KEY (`controlId`) REFERENCES `controls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `controls_framework_idx` ON `controls` (`framework`,`provider`);--> statement-breakpoint
CREATE INDEX `drift_events_occurred_at_idx` ON `drift_events` (`occurredAt`);--> statement-breakpoint
CREATE INDEX `drift_events_provider_idx` ON `drift_events` (`provider`);--> statement-breakpoint
CREATE INDEX `finding_observations_status_severity_idx` ON `finding_observations` (`status`,`severity`);--> statement-breakpoint
CREATE INDEX `finding_observations_provider_idx` ON `finding_observations` (`provider`);--> statement-breakpoint
CREATE INDEX `finding_observations_control_idx` ON `finding_observations` (`controlId`);--> statement-breakpoint
CREATE INDEX `scan_runs_completed_at_idx` ON `scan_runs` (`completedAt`);--> statement-breakpoint
CREATE INDEX `scan_runs_provider_idx` ON `scan_runs` (`provider`);