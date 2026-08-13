-- This migration is intentionally resumable. MySQL DDL auto-commits, so a
-- connection failure can otherwise leave half of an ALTER applied and make the
-- next run fail with "duplicate column/index".

-- Historical rows cannot discover their original Agora account from their own
-- columns. The operator must explicitly bind them to the profile containing
-- the legacy production credentials before running this migration:
--   SET @legacy_classroom_resource_profile_key = 'channel_a_v1';
SET @legacy_classroom_resource_profile_key =
  CONVERT(TRIM(@legacy_classroom_resource_profile_key) USING utf8mb4)
  COLLATE utf8mb4_unicode_ci;
DROP TEMPORARY TABLE IF EXISTS `classroom_resource_migration_assertions`;
CREATE TEMPORARY TABLE `classroom_resource_migration_assertions` (
  `assertion_name` VARCHAR(128) NOT NULL,
  `assertion_passed` TINYINT NOT NULL
);
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'legacy classroom resource profile key is required',
  IF(
    NULLIF(@legacy_classroom_resource_profile_key, '') IS NOT NULL
      AND CHAR_LENGTH(@legacy_classroom_resource_profile_key) <= 64,
    1,
    NULL
  )
);
DELETE FROM `classroom_resource_migration_assertions`;

-- Pin the operator decision. A resumable migration must never rewrite
-- historical bindings merely because a later invocation supplies a different
-- legacy key.
CREATE TABLE IF NOT EXISTS `classroom_resource_binding_migration_state` (
  `migration_key` VARCHAR(64) NOT NULL,
  `legacy_profile_key` VARCHAR(64) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`migration_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `classroom_resource_binding_migration_state`
  (`migration_key`, `legacy_profile_key`)
VALUES
  ('2026-07-28-classroom-resource-profiles', @legacy_classroom_resource_profile_key);

INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
SELECT
  'legacy classroom resource profile key differs from the original migration',
  IF(EXISTS(
    SELECT 1
      FROM `classroom_resource_binding_migration_state`
     WHERE `migration_key` = '2026-07-28-classroom-resource-profiles'
       AND BINARY `legacy_profile_key` =
           BINARY @legacy_classroom_resource_profile_key
  ), 1, NULL);
DELETE FROM `classroom_resource_migration_assertions`;

SET @ddl = IF(
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'rooms'
      AND column_name = 'classroom_resource_profile_key'
  ),
  'DO 0',
  'ALTER TABLE `rooms` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT '''''
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
  'ALTER TABLE `room_periodic_configs` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT '''''
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
  'ALTER TABLE `room_records` ADD COLUMN `classroom_resource_profile_key` VARCHAR(64) NOT NULL DEFAULT '''''
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

-- Preserve immutable-binding semantics without guessing the legacy account.
-- resource_binding_source identifies rows that existed before this migration;
-- new application writes must always persist their own resolved profile.
UPDATE `rooms`
SET `classroom_resource_profile_key` = @legacy_classroom_resource_profile_key,
    `resource_bound_at` = COALESCE(`resource_bound_at`, `created_at`)
WHERE `resource_binding_source` = 'migration_backfill'
  AND TRIM(`classroom_resource_profile_key`) = '';

UPDATE `room_periodic_configs`
SET `classroom_resource_profile_key` = @legacy_classroom_resource_profile_key,
    `resource_bound_at` = COALESCE(`resource_bound_at`, `created_at`)
WHERE `resource_binding_source` = 'migration_backfill'
  AND TRIM(`classroom_resource_profile_key`) = '';

UPDATE `room_records`
SET `classroom_resource_profile_key` = @legacy_classroom_resource_profile_key
WHERE `recording_status` = 'legacy'
  AND TRIM(`classroom_resource_profile_key`) = '';

-- Fail closed before removing defaults. These checks are also the executable
-- acceptance gate for a rerun: every room/periodic/recording binding must be
-- present, legacy rows must retain the pinned profile, and child facts must
-- agree with their owning room/periodic configuration.
SELECT COUNT(*) INTO @binding_violation_count
FROM `rooms`
WHERE TRIM(`classroom_resource_profile_key`) = ''
   OR TRIM(`resource_binding_source`) = ''
   OR `resource_bound_at` IS NULL
   OR (`resource_binding_source` = 'migration_backfill'
       AND BINARY `classroom_resource_profile_key` <>
           BINARY @legacy_classroom_resource_profile_key);
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'rooms contain invalid classroom resource bindings',
  IF(@binding_violation_count = 0, 1, NULL)
);
DELETE FROM `classroom_resource_migration_assertions`;

SELECT COUNT(*) INTO @binding_violation_count
FROM `room_periodic_configs`
WHERE TRIM(`classroom_resource_profile_key`) = ''
   OR TRIM(`resource_binding_source`) = ''
   OR `resource_bound_at` IS NULL
   OR (`resource_binding_source` = 'migration_backfill'
       AND BINARY `classroom_resource_profile_key` <>
           BINARY @legacy_classroom_resource_profile_key);
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'periodic rooms contain invalid classroom resource bindings',
  IF(@binding_violation_count = 0, 1, NULL)
);
DELETE FROM `classroom_resource_migration_assertions`;

SELECT COUNT(*) INTO @binding_violation_count
FROM `room_records`
WHERE TRIM(`classroom_resource_profile_key`) = ''
   OR (`recording_status` = 'legacy'
       AND BINARY `classroom_resource_profile_key` <>
           BINARY @legacy_classroom_resource_profile_key);
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'recordings contain invalid classroom resource bindings',
  IF(@binding_violation_count = 0, 1, NULL)
);
DELETE FROM `classroom_resource_migration_assertions`;

SELECT COUNT(*) INTO @binding_violation_count
FROM `room_records` AS recording
LEFT JOIN `rooms` AS room ON room.`room_uuid` = recording.`room_uuid`
WHERE room.`id` IS NULL
   OR BINARY recording.`classroom_resource_profile_key` <>
      BINARY room.`classroom_resource_profile_key`;
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'recording and room resource bindings disagree',
  IF(@binding_violation_count = 0, 1, NULL)
);
DELETE FROM `classroom_resource_migration_assertions`;

SELECT COUNT(*) INTO @binding_violation_count
FROM `rooms` AS room
LEFT JOIN `room_periodic_configs` AS periodic
  ON periodic.`periodic_uuid` = room.`periodic_uuid`
WHERE TRIM(room.`periodic_uuid`) <> ''
  AND (
    periodic.`id` IS NULL
    OR BINARY room.`classroom_resource_profile_key` <>
       BINARY periodic.`classroom_resource_profile_key`
  );
INSERT INTO `classroom_resource_migration_assertions`
  (`assertion_name`, `assertion_passed`)
VALUES (
  'periodic instance and template resource bindings disagree',
  IF(@binding_violation_count = 0, 1, NULL)
);
DELETE FROM `classroom_resource_migration_assertions`;

-- After the one-time backfill, new writes must always provide their resolved
-- binding. Removing defaults prevents any unreviewed creation path from
-- silently falling back to the historical Agora profile.
ALTER TABLE `rooms`
  ALTER COLUMN `classroom_resource_profile_key` DROP DEFAULT,
  ALTER COLUMN `resource_binding_source` DROP DEFAULT,
  MODIFY COLUMN `resource_bound_at` DATETIME(3) NOT NULL;

ALTER TABLE `room_periodic_configs`
  ALTER COLUMN `classroom_resource_profile_key` DROP DEFAULT,
  ALTER COLUMN `resource_binding_source` DROP DEFAULT,
  MODIFY COLUMN `resource_bound_at` DATETIME(3) NOT NULL;

ALTER TABLE `room_records`
  ALTER COLUMN `classroom_resource_profile_key` DROP DEFAULT;

DROP TEMPORARY TABLE `classroom_resource_migration_assertions`;
