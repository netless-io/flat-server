CREATE TABLE IF NOT EXISTS `classroom_resource_binding_migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `operation_id` CHAR(36) NOT NULL,
  `room_uuid` VARCHAR(40) NOT NULL,
  `source_profile_key` VARCHAR(64) NOT NULL,
  `target_profile_key` VARCHAR(64) NOT NULL,
  `reason` VARCHAR(1024) NOT NULL,
  `operator_uuid` VARCHAR(191) NOT NULL,
  `status` VARCHAR(16) NOT NULL,
  `migrated_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_classroom_resource_binding_migrations_operation` (`operation_id`),
  KEY `idx_classroom_resource_binding_migrations_room` (`room_uuid`),
  KEY `idx_classroom_resource_binding_migrations_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
