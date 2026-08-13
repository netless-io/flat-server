import { DataSource, EntityManager } from "typeorm";
import { getClassroomResourceProfile } from "./Registry";

export type BindingMigrationRequest = {
    operationID: string;
    expectedProfileKey: string;
    targetProfileKey: string;
    reason: string;
    operatorUUID: string;
};

export type BindingMigrationResult = {
    operationID: string;
    roomUUID: string;
    sourceProfileKey: string;
    targetProfileKey: string;
    status: "completed";
    duplicate: boolean;
    migratedAt: Date;
};

type RoomBindingRow = {
    roomUUID: string;
    profileKey: string;
};

type MigrationRow = {
    operationID: string;
    roomUUID: string;
    sourceProfileKey: string;
    targetProfileKey: string;
    status: "completed";
    migratedAt: Date;
};

function required(value: string, field: string): string {
    const normalized = String(value || "").trim();
    if (!normalized) {
        throw new Error(`${field} is required`);
    }
    return normalized;
}

async function existingMigration(
    manager: EntityManager,
    operationID: string,
): Promise<MigrationRow | undefined> {
    const rows = (await manager.query(
        `SELECT operation_id AS operationID, room_uuid AS roomUUID,
                source_profile_key AS sourceProfileKey,
                target_profile_key AS targetProfileKey, status,
                migrated_at AS migratedAt
           FROM classroom_resource_binding_migrations
          WHERE operation_id = ?
          LIMIT 1`,
        [operationID],
    )) as MigrationRow[];
    return rows[0];
}

// migrateRoomBinding is deliberately internal-only. Provider changes are a
// control-plane operation, never an implicit join-time fallback.
export async function migrateRoomBinding(
    dataSource: DataSource,
    roomUUIDValue: string,
    request: BindingMigrationRequest,
): Promise<BindingMigrationResult> {
    const roomUUID = required(roomUUIDValue, "roomUUID");
    const operationID = required(request.operationID, "operationID");
    const expectedProfileKey = required(request.expectedProfileKey, "expectedProfileKey");
    const targetProfileKey = required(request.targetProfileKey, "targetProfileKey");
    const reason = required(request.reason, "reason");
    const operatorUUID = required(request.operatorUUID, "operatorUUID");
    getClassroomResourceProfile(expectedProfileKey);
    getClassroomResourceProfile(targetProfileKey);
    if (expectedProfileKey === targetProfileKey) {
        throw new Error("target profile must differ from the current profile");
    }

    return dataSource.transaction(async manager => {
        const duplicate = await existingMigration(manager, operationID);
        if (duplicate) {
            if (
                duplicate.roomUUID !== roomUUID ||
                duplicate.sourceProfileKey !== expectedProfileKey ||
                duplicate.targetProfileKey !== targetProfileKey
            ) {
                throw new Error("migration operationID was already used with different parameters");
            }
            return { ...duplicate, duplicate: true };
        }

        const rooms = (await manager.query(
            `SELECT room_uuid AS roomUUID,
                    classroom_resource_profile_key AS profileKey
               FROM rooms
              WHERE room_uuid = ? AND is_delete = 0
              FOR UPDATE`,
            [roomUUID],
        )) as RoomBindingRow[];
        const room = rooms[0];
        if (!room) {
            throw new Error("room binding not found");
        }
        if (room.profileKey !== expectedProfileKey) {
            throw new Error(
                `room profile changed: current=${room.profileKey} expected=${expectedProfileKey}`,
            );
        }

        const activeRecordings = (await manager.query(
            `SELECT COUNT(*) AS activeCount
               FROM room_records
              WHERE room_uuid = ? AND is_delete = 0
                AND recording_status IN ('started', 'acquired', 'recording')`,
            [roomUUID],
        )) as Array<{ activeCount: string | number }>;
        if (Number(activeRecordings[0]?.activeCount || 0) > 0) {
            throw new Error("active recording must be stopped before provider migration");
        }

        const migratedAt = new Date();
        await manager.query(
            `UPDATE rooms
                SET classroom_resource_profile_key = ?,
                    resource_binding_source = 'provider_migration',
                    resource_bound_at = ?,
                    updated_at = ?
              WHERE room_uuid = ? AND classroom_resource_profile_key = ?`,
            [targetProfileKey, migratedAt, migratedAt, roomUUID, expectedProfileKey],
        );
        await manager.query(
            `INSERT INTO classroom_resource_binding_migrations
                (operation_id, room_uuid, source_profile_key, target_profile_key,
                 reason, operator_uuid, status, migrated_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
            [
                operationID,
                roomUUID,
                expectedProfileKey,
                targetProfileKey,
                reason,
                operatorUUID,
                migratedAt,
                migratedAt,
            ],
        );
        return {
            operationID,
            roomUUID,
            sourceProfileKey: expectedProfileKey,
            targetProfileKey,
            status: "completed",
            duplicate: false,
            migratedAt,
        };
    });
}
