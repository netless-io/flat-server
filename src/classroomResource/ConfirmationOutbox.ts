import { EntityManager } from "typeorm";
import { dataSource } from "../thirdPartyService/TypeORMService";
import { loggerServer, parseError } from "../logger";
import { confirmClassroomResourceReservation } from "./BillingReservationClient";

export async function enqueueClassroomResourceConfirmation(
    manager: EntityManager,
    operationID: string,
    objectUUID: string,
    ownerUUID: string,
    objectType: "room" | "periodic",
): Promise<void> {
    await manager.query(
        `INSERT INTO classroom_resource_confirmation_outbox
            (operation_id, object_uuid, owner_uuid, object_type, status, attempt_count, next_attempt_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', 0, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE object_uuid = VALUES(object_uuid), updated_at = UTC_TIMESTAMP()`,
        [operationID, objectUUID, ownerUUID, objectType],
    );
}

export async function findClassroomCreationOperation(
    operationID: string,
    ownerUUID: string,
    objectType: "room" | "periodic",
): Promise<string | undefined> {
    const rows = (await dataSource.query(
        `SELECT object_uuid
           FROM classroom_resource_confirmation_outbox
          WHERE operation_id = ? AND owner_uuid = ? AND object_type = ?
          LIMIT 1`,
        [operationID, ownerUUID, objectType],
    )) as Array<{ object_uuid: string }>;
    return rows[0]?.object_uuid;
}

export async function deliverClassroomResourceConfirmation(
    operationID: string,
): Promise<void> {
    const rows = (await dataSource.query(
        `SELECT operation_id, object_uuid
           FROM classroom_resource_confirmation_outbox
          WHERE operation_id = ? AND status = 'pending'
          LIMIT 1`,
        [operationID],
    )) as Array<{ operation_id: string; object_uuid: string }>;
    if (!rows.length) return;
    try {
        await confirmClassroomResourceReservation(rows[0].operation_id, rows[0].object_uuid);
        await dataSource.query(
            `UPDATE classroom_resource_confirmation_outbox
                SET status = 'confirmed', confirmed_at = UTC_TIMESTAMP(),
                    last_error = NULL, updated_at = UTC_TIMESTAMP()
              WHERE operation_id = ?`,
            [operationID],
        );
    } catch (error) {
        await dataSource.query(
            `UPDATE classroom_resource_confirmation_outbox
                SET attempt_count = attempt_count + 1,
                    next_attempt_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL LEAST(300, POW(2, LEAST(attempt_count, 8))) SECOND),
                    last_error = LEFT(?, 1024), updated_at = UTC_TIMESTAMP()
              WHERE operation_id = ?`,
            [String(error), operationID],
        );
        loggerServer.warn("classroom resource confirmation deferred", parseError(error));
    }
}

export async function retryPendingClassroomResourceConfirmations(): Promise<void> {
    const rows = (await dataSource.query(
        `SELECT operation_id
           FROM classroom_resource_confirmation_outbox
          WHERE status = 'pending' AND next_attempt_at <= UTC_TIMESTAMP()
          ORDER BY id ASC
          LIMIT 100`,
    )) as Array<{ operation_id: string }>;
    for (const row of rows) {
        await deliverClassroomResourceConfirmation(row.operation_id);
    }
}
