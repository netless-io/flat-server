import test from "ava";
import { DataSource } from "typeorm";
import { migrateRoomBinding } from "./BindingMigration";
import { getDefaultClassroomResourceProfile, listClassroomResourcePublicConfigs } from "./Registry";

test("explicit room binding migration is atomic and audited", async ava => {
    const source = getDefaultClassroomResourceProfile();
    const target = listClassroomResourcePublicConfigs().find(
        item => item.profileKey !== source.key,
    );
    if (!target) {
        ava.pass("test configuration has only one profile");
        return;
    }
    const writes: Array<{ sql: string; params: unknown[] }> = [];
    const manager = {
        query: async (sql: string, params: unknown[] = []): Promise<unknown[]> => {
            if (sql.includes("FROM classroom_resource_binding_migrations")) return [];
            if (sql.includes("FROM rooms")) {
                return [{ roomUUID: "room-migrate", profileKey: source.key }];
            }
            if (sql.includes("COUNT(*) AS activeCount")) return [{ activeCount: 0 }];
            writes.push({ sql, params });
            return [];
        },
    };
    const dataSource = {
        transaction: async <T>(callback: (value: typeof manager) => Promise<T>): Promise<T> =>
            callback(manager),
    } as unknown as DataSource;

    const result = await migrateRoomBinding(dataSource, "room-migrate", {
        operationID: "36bda908-e6d7-4f08-85ee-3a2e5a629888",
        expectedProfileKey: source.key,
        targetProfileKey: target.profileKey,
        reason: "operator-confirmed incident failover",
        operatorUUID: "admin-user",
    });

    ava.false(result.duplicate);
    ava.is(result.sourceProfileKey, source.key);
    ava.is(result.targetProfileKey, target.profileKey);
    ava.is(writes.length, 2);
    ava.true(writes[0].sql.includes("UPDATE rooms"));
    ava.true(writes[1].sql.includes("INSERT INTO classroom_resource_binding_migrations"));
});

test("migration rejects an active recording before changing the room", async ava => {
    const source = getDefaultClassroomResourceProfile();
    const target = listClassroomResourcePublicConfigs().find(
        item => item.profileKey !== source.key,
    );
    if (!target) {
        ava.pass("test configuration has only one profile");
        return;
    }
    let writeCount = 0;
    const manager = {
        query: async (sql: string): Promise<unknown[]> => {
            if (sql.includes("FROM classroom_resource_binding_migrations")) return [];
            if (sql.includes("FROM rooms")) {
                return [{ roomUUID: "room-recording", profileKey: source.key }];
            }
            if (sql.includes("COUNT(*) AS activeCount")) return [{ activeCount: 1 }];
            writeCount += 1;
            return [];
        },
    };
    const dataSource = {
        transaction: async <T>(callback: (value: typeof manager) => Promise<T>): Promise<T> =>
            callback(manager),
    } as unknown as DataSource;

    const error = await ava.throwsAsync(() =>
        migrateRoomBinding(dataSource, "room-recording", {
            operationID: "2a5f2eb0-1417-45f2-bfa6-5a6812093fe0",
            expectedProfileKey: source.key,
            targetProfileKey: target.profileKey,
            reason: "incident",
            operatorUUID: "admin-user",
        }),
    );
    ava.regex(error?.message || "", /active recording/);
    ava.is(writeCount, 0);
});
