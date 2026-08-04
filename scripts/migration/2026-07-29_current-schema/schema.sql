-- Generated from the current flat-server TypeORM entities.

-- Run only inside a newly created, empty flat-server database.

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `cloud_storage_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `total_usage` bigint unsigned NOT NULL DEFAULT 0 COMMENT 'total cloud storage of a user (bytes)',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cloud_storage_configs_user_uuid_uindex` (`user_uuid`),
  KEY `cloud_storage_configs_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cloud_storage_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `file_uuid` varchar(40) NOT NULL,
  `file_name` varchar(128) NOT NULL COMMENT 'file name',
  `file_size` int unsigned NOT NULL COMMENT 'file size (bytes)',
  `file_url` varchar(256) NOT NULL COMMENT 'file url',
  `directory_path` varchar(300) NOT NULL DEFAULT '/' COMMENT 'directory path',
  `payload` json NOT NULL DEFAULT ('{}'),
  `resource_type` varchar(20) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cloud_storage_files_file_uuid_uindex` (`file_uuid`),
  KEY `cloud_storage_files_resource_type_index` (`resource_type`),
  KEY `cloud_storage_files_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cloud_storage_user_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `file_uuid` varchar(40) NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `cloud_storage_user_files_file_uuid_index` (`file_uuid`),
  KEY `cloud_storage_user_files_user_uuid_index` (`user_uuid`),
  KEY `cloud_storage_user_files_is_delete_index` (`is_delete`),
  UNIQUE KEY `cloud_storage_user_files_file_uuid_user_uuid_uindex` (`file_uuid`, `user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `oauth_infos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `oauth_uuid` varchar(40) NOT NULL,
  `owner_uuid` varchar(40) NOT NULL,
  `app_name` varchar(30) NOT NULL COMMENT 'application name',
  `app_desc` varchar(300) NOT NULL COMMENT 'application description',
  `client_id` varchar(40) NOT NULL,
  `homepage_url` varchar(100) NOT NULL COMMENT 'application homepage url',
  `logo_url` varchar(300) NOT NULL COMMENT 'application logo url',
  `scopes` varchar(300) NOT NULL,
  `callbacks_url` varchar(2005) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_infos_oauth_uuid_uindex` (`oauth_uuid`),
  KEY `oauth_infos_owner_uuid_index` (`owner_uuid`),
  UNIQUE KEY `oauth_infos_client_id_uindex` (`client_id`),
  KEY `oauth_infos_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `oauth_secrets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `oauth_uuid` varchar(40) NOT NULL,
  `secret_uuid` varchar(40) NOT NULL,
  `client_id` varchar(40) NOT NULL COMMENT 'application client id',
  `client_secret` varchar(40) NOT NULL COMMENT 'application client secret',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `oauth_secrets_oauth_uuid_index` (`oauth_uuid`),
  UNIQUE KEY `oauth_secrets_secret_uuid_uindex` (`secret_uuid`),
  KEY `oauth_secrets_client_id_index` (`client_id`),
  KEY `oauth_secrets_client_secret_index` (`client_secret`),
  KEY `oauth_secrets_is_delete_index` (`is_delete`),
  UNIQUE KEY `oauth_secrets_client_id_client_secret_uindex` (`client_id`, `client_secret`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `oauth_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `oauth_uuid` varchar(40) NOT NULL,
  `user_uuid` varchar(40) NOT NULL COMMENT 'user id',
  `scopes` varchar(300) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `oauth_users_oauth_uuid_index` (`oauth_uuid`),
  KEY `oauth_users_user_uuid_index` (`user_uuid`),
  KEY `oauth_users_is_delete_index` (`is_delete`),
  UNIQUE KEY `oauth_users_oauth_uuid_user_uuid_uindex` (`oauth_uuid`, `user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partners` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `partner_uuid` varchar(40) NOT NULL,
  `content` varchar(2083) NOT NULL COMMENT 'meta data',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partners_partner_uuid_uindex` (`partner_uuid`),
  KEY `partners_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partner_rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `partner_uuid` varchar(40) NOT NULL,
  `room_uuid` varchar(40) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `partner_rooms_partner_uuid_index` (`partner_uuid`),
  KEY `partner_rooms_room_uuid_index` (`room_uuid`),
  KEY `partner_rooms_is_delete_index` (`is_delete`),
  UNIQUE KEY `partner_rooms_partner_uuid_room_uuid_uindex` (`partner_uuid`, `room_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rooms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `room_uuid` varchar(40) NOT NULL,
  `periodic_uuid` varchar(40) NOT NULL COMMENT 'periodic uuid',
  `owner_uuid` varchar(40) NOT NULL,
  `title` varchar(150) NOT NULL COMMENT 'room title',
  `room_type` enum('OneToOne','BigClass','SmallClass') NOT NULL COMMENT 'room type',
  `room_status` enum('Idle','Started','Paused','Stopped') NOT NULL COMMENT 'current room status',
  `begin_time` datetime(3) NOT NULL COMMENT 'room begin time',
  `end_time` datetime(3) NOT NULL COMMENT 'room end time',
  `region` enum('cn-hz','us-sv','sg','in-mum','gb-lon') NOT NULL,
  `whiteboard_room_uuid` varchar(40) NOT NULL,
  `classroom_resource_profile_key` varchar(64) NOT NULL DEFAULT 'channel_a_v1',
  `resource_binding_source` varchar(32) NOT NULL DEFAULT 'migration_backfill',
  `resource_bound_at` datetime(3) NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  `has_record` tinyint NOT NULL DEFAULT 0,
  `is_ai` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_room_uuid_uindex` (`room_uuid`),
  KEY `rooms_periodic_uuid_index` (`periodic_uuid`),
  KEY `rooms_owner_uuid_index` (`owner_uuid`),
  KEY `rooms_room_type_index` (`room_type`),
  KEY `rooms_room_status_index` (`room_status`),
  KEY `rooms_begin_time_index` (`begin_time`),
  UNIQUE KEY `rooms_whiteboard_room_uuid_uindex` (`whiteboard_room_uuid`),
  KEY `rooms_classroom_resource_profile_index` (`classroom_resource_profile_key`),
  KEY `rooms_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_periodic` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `periodic_uuid` varchar(40) NOT NULL,
  `fake_room_uuid` varchar(40) NOT NULL,
  `begin_time` datetime(3) NOT NULL COMMENT 'room begin time',
  `end_time` datetime(3) NOT NULL COMMENT 'room end time',
  `room_status` enum('Idle','Started','Paused','Stopped') NOT NULL COMMENT 'current room status',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_periodic_fake_room_uuid_uindex` (`fake_room_uuid`),
  KEY `room_periodic_begin_time_index` (`begin_time`),
  KEY `room_periodic_room_status_index` (`room_status`),
  KEY `room_periodic_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_periodic_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `periodic_uuid` varchar(40) NOT NULL,
  `owner_uuid` varchar(40) NOT NULL,
  `title` varchar(150) NOT NULL COMMENT 'room title',
  `room_origin_begin_time` datetime(3) NOT NULL COMMENT 'room origin begin time',
  `room_origin_end_time` datetime(3) NOT NULL COMMENT 'room origin end time',
  `weeks` varchar(13) NOT NULL COMMENT 'periodic week',
  `rate` tinyint NOT NULL COMMENT 'periodic rate (max 50)',
  `end_time` datetime(3) NOT NULL COMMENT 'periodic end time',
  `room_type` enum('OneToOne','BigClass','SmallClass') NOT NULL COMMENT 'room type',
  `periodic_status` enum('Idle','Started','Stopped') NOT NULL COMMENT 'current periodic status',
  `region` enum('cn-hz','us-sv','sg','in-mum','gb-lon') NOT NULL,
  `classroom_resource_profile_key` varchar(64) NOT NULL DEFAULT 'channel_a_v1',
  `resource_binding_source` varchar(32) NOT NULL DEFAULT 'migration_backfill',
  `resource_bound_at` datetime(3) NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `periodic_configs_periodic_uuid_uindex` (`periodic_uuid`),
  KEY `periodic_configs_owner_uuid_index` (`owner_uuid`),
  KEY `room_periodic_configs_type_index` (`room_type`),
  KEY `rooms_periodic_status_index` (`periodic_status`),
  KEY `periodic_configs_classroom_resource_profile_index` (`classroom_resource_profile_key`),
  KEY `periodic_configs_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_periodic_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `periodic_uuid` varchar(40) NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `room_periodic_users_room_uuid_index` (`periodic_uuid`),
  KEY `room_periodic_users_user_uuid_index` (`user_uuid`),
  KEY `room_periodic_users_is_delete_index` (`is_delete`),
  UNIQUE KEY `room_periodic_periodic_uuid_user_uuid_uindex` (`periodic_uuid`, `user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `room_uuid` varchar(40) NOT NULL,
  `begin_time` datetime(3) NOT NULL COMMENT 'room record begin time',
  `end_time` datetime(3) NOT NULL COMMENT 'room record end time',
  `agora_sid` varchar(40) NOT NULL DEFAULT '' COMMENT 'agora record id',
  `classroom_resource_profile_key` varchar(64) NOT NULL DEFAULT 'channel_a_v1',
  `agora_resource_id` varchar(128) NOT NULL DEFAULT '',
  `recording_status` varchar(32) NOT NULL DEFAULT 'legacy',
  `recording_storage_bucket` varchar(191) NOT NULL DEFAULT '',
  `recording_storage_prefix` varchar(191) NOT NULL DEFAULT '',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `room_records_room_uuid_index` (`room_uuid`),
  KEY `room_records_classroom_resource_profile_index` (`classroom_resource_profile_key`),
  KEY `room_records_agora_resource_id_index` (`agora_resource_id`),
  KEY `room_records_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `room_uuid` varchar(40) NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `rtc_uid` varchar(6) NOT NULL COMMENT 'front-end needs this field to set rtc',
  `grade` int NOT NULL DEFAULT -1,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `room_users_room_uuid_index` (`room_uuid`),
  KEY `room_users_user_uuid_index` (`user_uuid`),
  KEY `room_users_is_delete_index` (`is_delete`),
  UNIQUE KEY `room_users_room_uuid_rtc_uid_uindex` (`room_uuid`, `rtc_uid`),
  UNIQUE KEY `room_users_room_uuid_user_uuid_uindex` (`room_uuid`, `user_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_agora` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'agora nickname',
  `union_uuid` varchar(32) NOT NULL COMMENT 'agora id',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_agora_user_uuid_uindex` (`user_uuid`),
  KEY `user_agora_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_agreement` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `is_agree_collect_data` tinyint NOT NULL DEFAULT 0,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_agreement_user_uuid_uindex` (`user_uuid`),
  KEY `user_agreement_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_apple` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'apple nickname',
  `union_uuid` varchar(50) NOT NULL COMMENT 'apple id',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_apple_user_uuid_uindex` (`user_uuid`),
  KEY `user_apple_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_email` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_email` varchar(100) NOT NULL COMMENT 'email address',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_user_uuid_uindex` (`user_uuid`),
  UNIQUE KEY `user_email_user_email_uindex` (`user_email`),
  KEY `user_email_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_github` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'github nickname',
  `union_uuid` varchar(32) NOT NULL COMMENT 'github id',
  `access_token` varchar(255) NOT NULL DEFAULT '' COMMENT '[deprecated]: github access token',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_github_user_uuid_uindex` (`user_uuid`),
  KEY `user_github_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_google` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'google nickname',
  `union_uuid` varchar(32) NOT NULL COMMENT 'google id',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_google_user_uuid_uindex` (`user_uuid`),
  KEY `user_google_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_phone` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'phone nickname',
  `phone_number` varchar(50) NOT NULL COMMENT 'phone number',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_phone_user_uuid_uindex` (`user_uuid`),
  UNIQUE KEY `user_phone_phone_number_uindex` (`phone_number`),
  KEY `user_phone_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_pmi` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `pmi` varchar(20) NOT NULL,
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_pmi_user_uuid_uindex` (`user_uuid`),
  UNIQUE KEY `user_pmi_pmi_uindex` (`pmi`),
  KEY `user_pmi_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_sensitive` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `type` varchar(128) NOT NULL COMMENT 'sensitive type like ''phone''',
  `content` varchar(2083) NOT NULL COMMENT 'sensitive value like ''123****4''',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_sensitive_user_uuid_index` (`user_uuid`),
  KEY `user_sensitive_type_index` (`type`),
  KEY `user_sensitive_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `user_password` varchar(255) NOT NULL,
  `avatar_url` varchar(2083) NOT NULL,
  `gender` enum('Man','Woman','None') NOT NULL DEFAULT 'None',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_uuid_uindex` (`user_uuid`),
  KEY `users_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_wechat` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `version` int NOT NULL,
  `user_uuid` varchar(40) NOT NULL,
  `user_name` varchar(40) NOT NULL COMMENT 'wechat nickname',
  `open_uuid` varchar(40) NOT NULL COMMENT 'wechat open id',
  `union_uuid` varchar(40) NOT NULL COMMENT 'wechat union id',
  `is_delete` tinyint NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_wechat_user_uuid_uindex` (`user_uuid`),
  KEY `user_wechat_is_delete_index` (`is_delete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

SET FOREIGN_KEY_CHECKS = 1;
