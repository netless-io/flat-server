import "reflect-metadata";

import fs from "fs";
import path from "path";
import { DataSource, EntityMetadata } from "typeorm";

import { CloudStorageConfigsModel } from "../../src/model/cloudStorage/CloudStorageConfigs";
import { CloudStorageFilesModel } from "../../src/model/cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "../../src/model/cloudStorage/CloudStorageUserFiles";
import { OAuthInfosModel } from "../../src/model/oauth/oauth-infos";
import { OAuthSecretsModel } from "../../src/model/oauth/oauth-secrets";
import { OAuthUsersModel } from "../../src/model/oauth/oauth-users";
import { PartnerModel } from "../../src/model/partner/Partner";
import { PartnerRoomModel } from "../../src/model/partner/PartnerRoom";
import { RoomModel } from "../../src/model/room/Room";
import { RoomPeriodicModel } from "../../src/model/room/RoomPeriodic";
import { RoomPeriodicConfigModel } from "../../src/model/room/RoomPeriodicConfig";
import { RoomPeriodicUserModel } from "../../src/model/room/RoomPeriodicUser";
import { RoomRecordModel } from "../../src/model/room/RoomRecord";
import { RoomUserModel } from "../../src/model/room/RoomUser";
import { UserAgoraModel } from "../../src/model/user/Agora";
import { UserAgreementModel } from "../../src/model/user/Agreement";
import { UserAppleModel } from "../../src/model/user/Apple";
import { UserEmailModel } from "../../src/model/user/Email";
import { UserGithubModel } from "../../src/model/user/Github";
import { UserGoogleModel } from "../../src/model/user/Google";
import { UserPhoneModel } from "../../src/model/user/Phone";
import { UserPmiModel } from "../../src/model/user/Pmi";
import { UserSensitiveModel } from "../../src/model/user/Sensitive";
import { UserModel } from "../../src/model/user/User";
import { UserWeChatModel } from "../../src/model/user/WeChat";

const entities = [
    UserModel,
    UserWeChatModel,
    UserGithubModel,
    UserAppleModel,
    UserAgoraModel,
    UserGoogleModel,
    UserPhoneModel,
    UserEmailModel,
    UserSensitiveModel,
    UserPmiModel,
    UserAgreementModel,
    RoomModel,
    RoomUserModel,
    RoomPeriodicConfigModel,
    RoomPeriodicModel,
    RoomPeriodicUserModel,
    RoomRecordModel,
    CloudStorageConfigsModel,
    CloudStorageFilesModel,
    CloudStorageUserFilesModel,
    OAuthInfosModel,
    OAuthSecretsModel,
    OAuthUsersModel,
    PartnerModel,
    PartnerRoomModel,
];

const dataSource = new DataSource({
    type: "mysql",
    host: "127.0.0.1",
    username: "schema-generator",
    password: "unused",
    database: "schema-generator",
    charset: "utf8mb4_unicode_ci",
    entities,
});

const quote = (value: string): string =>
    `'${value.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;

const columnType = (column: EntityMetadata["columns"][number]): string => {
    const type = dataSource.driver.normalizeType(column);
    if (type === "varchar") {
        return `varchar(${column.length || 255})`;
    }
    if (type === "enum") {
        return `enum(${(column.enum || []).map(value => quote(String(value))).join(",")})`;
    }
    if ((type === "datetime" || type === "timestamp") && column.precision !== undefined) {
        return `${type}(${column.precision})`;
    }
    return `${type}${column.unsigned ? " unsigned" : ""}`;
};

const columnDefault = (value: unknown): string => {
    if (typeof value === "function") {
        return String(value());
    }
    if (typeof value === "boolean") {
        return value ? "1" : "0";
    }
    if (typeof value === "number") {
        return String(value);
    }
    return quote(String(value));
};

const createTable = (metadata: EntityMetadata): string => {
    const definitions = metadata.columns.map(column => {
        const parts = [
            `  \`${column.databaseName}\` ${columnType(column)}`,
            column.isNullable ? "NULL" : "NOT NULL",
        ];
        if (column.default !== undefined) {
            parts.push(`DEFAULT ${columnDefault(column.default)}`);
        }
        if (column.isGenerated && column.generationStrategy === "increment") {
            parts.push("AUTO_INCREMENT");
        }
        if (column.onUpdate) {
            parts.push(`ON UPDATE ${column.onUpdate}`);
        }
        if (column.comment) {
            parts.push(`COMMENT ${quote(column.comment)}`);
        }
        return parts.join(" ");
    });

    const primaryColumns = metadata.columns.filter(column => column.isPrimary);
    if (primaryColumns.length > 0) {
        definitions.push(
            `  PRIMARY KEY (${primaryColumns.map(column => `\`${column.databaseName}\``).join(", ")})`,
        );
    }
    for (const index of metadata.indices) {
        const kind = index.isUnique ? "UNIQUE KEY" : "KEY";
        definitions.push(
            `  ${kind} \`${index.name}\` (${index.columns
                .map(column => `\`${column.databaseName}\``)
                .join(", ")})`,
        );
    }

    return [
        `CREATE TABLE \`${metadata.tableName}\` (`,
        definitions.join(",\n"),
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
    ].join("\n");
};

const main = async (): Promise<void> => {
    await (dataSource as unknown as { buildMetadatas(): Promise<void> }).buildMetadatas();

    const migrationPath = path.join(
        __dirname,
        "2026-07-28_classroom-resource-profiles",
        "migration.sql",
    );
    const migration = fs.readFileSync(migrationPath, "utf8");
    const outbox = migration.match(
        /CREATE TABLE IF NOT EXISTS `classroom_resource_confirmation_outbox`[\s\S]*?;\n/,
    );
    if (!outbox) {
        throw new Error("Unable to find classroom_resource_confirmation_outbox migration");
    }
    const migrationState = migration.match(
        /CREATE TABLE IF NOT EXISTS `classroom_resource_binding_migration_state`[\s\S]*?;\n/,
    );
    if (!migrationState) {
        throw new Error("Unable to find classroom_resource_binding_migration_state migration");
    }

    const sql = [
        "-- Generated from the current flat-server TypeORM entities.",
        "-- Run only inside a newly created, empty flat-server database.",
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS = 0;",
        ...dataSource.entityMetadatas.map(createTable),
        migrationState[0].trim(),
        outbox[0].trim(),
        "SET FOREIGN_KEY_CHECKS = 1;",
        "",
    ].join("\n\n");

    process.stdout.write(sql);
};

void main();
