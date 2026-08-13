import { DataSource } from "typeorm";
import { hasClassroomResourceProfile } from "./Registry";

type CountRow = {
    violation: string;
    violationCount: string | number;
};

// Room/profile bindings are execution facts. Starting with an unknown or
// inconsistent binding could sign a token with the wrong Agora account, so
// startup deliberately fails closed instead of silently using the default.
export async function assertClassroomResourceBindingIntegrity(
    dataSource: DataSource,
): Promise<void> {
    const counts = (await dataSource.query(`
        SELECT 'rooms.unbound' AS violation, COUNT(*) AS violationCount
          FROM rooms
         WHERE TRIM(classroom_resource_profile_key) = ''
            OR TRIM(resource_binding_source) = ''
            OR resource_bound_at IS NULL
        UNION ALL
        SELECT 'periodic.unbound', COUNT(*)
          FROM room_periodic_configs
         WHERE TRIM(classroom_resource_profile_key) = ''
            OR TRIM(resource_binding_source) = ''
            OR resource_bound_at IS NULL
        UNION ALL
        SELECT 'recordings.unbound', COUNT(*)
          FROM room_records
         WHERE TRIM(classroom_resource_profile_key) = ''
        UNION ALL
        SELECT 'recordings.room_binding_mismatch', COUNT(*)
          FROM room_records recording
          LEFT JOIN rooms room ON room.room_uuid = recording.room_uuid
         WHERE room.id IS NULL
            OR BINARY recording.classroom_resource_profile_key <>
               BINARY room.classroom_resource_profile_key
        UNION ALL
        SELECT 'periodic.room_binding_mismatch', COUNT(*)
          FROM rooms room
          LEFT JOIN room_periodic_configs periodic
            ON periodic.periodic_uuid = room.periodic_uuid
         WHERE TRIM(room.periodic_uuid) <> ''
           AND (
                periodic.id IS NULL
                OR BINARY room.classroom_resource_profile_key <>
                   BINARY periodic.classroom_resource_profile_key
           )
    `)) as CountRow[];
    const violations = counts.filter(row => Number(row.violationCount) > 0);
    if (violations.length > 0) {
        throw new Error(
            `classroom resource binding integrity check failed: ${violations
                .map(row => `${row.violation}=${row.violationCount}`)
                .join(", ")}`,
        );
    }

    const bindings = (await dataSource.query(`
        SELECT DISTINCT classroom_resource_profile_key AS profileKey FROM rooms
        UNION
        SELECT DISTINCT classroom_resource_profile_key FROM room_periodic_configs
        UNION
        SELECT DISTINCT classroom_resource_profile_key FROM room_records
    `)) as Array<{ profileKey: string }>;
    const unknown = bindings
        .map(row => String(row.profileKey || "").trim())
        .filter(key => key !== "" && !hasClassroomResourceProfile(key));
    if (unknown.length > 0) {
        throw new Error(
            `classroom resource binding references profiles missing from configuration: ${unknown.join(
                ", ",
            )}`,
        );
    }
}
