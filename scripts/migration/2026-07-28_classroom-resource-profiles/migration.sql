-- This migration is intentionally resumable. MySQL DDL auto-commits, so a
-- connection failure can otherwise leave half of an ALTER applied and make the
-- next run fail with "duplicate column/index".

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'rooms'
      AND column_name = 'classroom_resource_profile_key'
  ),
  'DO 0',
  'ALTER TABLE `rooms` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT ''channel_a_v1'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'rooms'
      AND column_name = 'resource_binding_source'
  ),
  'DO 0',
  'ALTER TABLE `rooms` ADD COLUMN `resource_binding_source` VARCHAR(32) NOT NULL DEFAULT ''migration_backfill'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'rooms'
      AND column_name = 'resource_bound_at'
  ),
  'DO 0',
  'ALTER TABLE `rooms` ADD COLUMN `resource_bound_at` DATETIME(3) NULL'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'rooms'
      AND index_name = 'rooms_classroom_resource_profile_index'
  ),
  'DO 0',
  'ALTER TABLE `rooms` ADD KEY `rooms_classroom_resource_profile_index` (`classroom_resource_profile_key`)'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_periodic_configs'
      AND column_name = 'classroom_resource_profile_key'
  ),
  'DO 0',
  'ALTER TABLE `room_periodic_configs` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT ''channel_a_v1'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_periodic_configs'
      AND column_name = 'resource_binding_source'
  ),
  'DO 0',
  'ALTER TABLE `room_periodic_configs` ADD COLUMN `resource_binding_source` VARCHAR(32) NOT NULL DEFAULT ''migration_backfill'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_periodic_configs'
      AND column_name = 'resource_bound_at'
  ),
  'DO 0',
  'ALTER TABLE `room_periodic_configs` ADD COLUMN `resource_bound_at` DATETIME(3) NULL'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'room_periodic_configs'
      AND index_name = 'periodic_configs_classroom_resource_profile_index'
  ),
  'DO 0',
  'ALTER TABLE `room_periodic_configs` ADD KEY `periodic_configs_classroom_resource_profile_index` (`classroom_resource_profile_key`)'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND column_name = 'classroom_resource_profile_key'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT ''channel_a_v1'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND column_name = 'agora_resource_id'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD COLUMN `agora_resource_id` VARCHAR(128) NOT NULL DEFAULT '''''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND column_name = 'recording_status'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD COLUMN `recording_status` VARCHAR(32) NOT NULL DEFAULT ''legacy'''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND column_name = 'recording_storage_bucket'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD COLUMN `recording_storage_bucket` VARCHAR(191) NOT NULL DEFAULT '''''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND column_name = 'recording_storage_prefix'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD COLUMN `recording_storage_prefix` VARCHAR(191) NOT NULL DEFAULT '''''
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND index_name = 'room_records_classroom_resource_profile_index'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD KEY `room_records_classroom_resource_profile_index` (`classroom_resource_profile_key`)'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'room_records'
      AND index_name = 'room_records_agora_resource_id_index'
  ),
  'DO 0',
  'ALTER TABLE `room_records` ADD KEY `room_records_agora_resource_id_index` (`agora_resource_id`)'
);
PREPARE migration_stmt FROM @ddl;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

CREATE TABLE IF NOT EXISTS `classroom_resource_confirmation_outbox` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `operation_id` VARCHAR(191) NOT NULL,
  `object_uuid` VARCHAR(191) NOT NULL,
  `owner_uuid` VARCHAR(191) NOT NULL,
  `object_type` VARCHAR(16) NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
  `attempt_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `next_attempt_at` DATETIME(3) NOT NULL,
  `last_error` VARCHAR(1024) NULL,
  `confirmed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_classroom_resource_confirmation_operation` (`operation_id`),
  KEY `idx_classroom_resource_confirmation_retry` (`status`, `next_attempt_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve the immutable-binding semantics for historical data. Existing
-- rooms all belong to channel_a_v1 at the initial cutover; created_at is the
-- best available binding timestamp.
UPDATE `rooms`
SET `resource_bound_at` = `created_at`
WHERE `resource_bound_at` IS NULL;

UPDATE `room_periodic_configs`
SET `resource_bound_at` = `created_at`
WHERE `resource_bound_at` IS NULL;
