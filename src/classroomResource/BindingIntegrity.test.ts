import test from "ava";
import { DataSource } from "typeorm";
import { getDefaultClassroomResourceProfile } from "./Registry";
import { assertClassroomResourceBindingIntegrity } from "./BindingIntegrity";

function fakeDataSource(results: unknown[][]): DataSource {
    let index = 0;
    return {
        query: async () => results[index++],
    } as unknown as DataSource;
}

test("binding integrity accepts configured immutable bindings", async ava => {
    const profile = getDefaultClassroomResourceProfile();
    await ava.notThrowsAsync(() =>
        assertClassroomResourceBindingIntegrity(
            fakeDataSource([
                [
                    { violation: "rooms.unbound", violationCount: 0 },
                    { violation: "periodic.unbound", violationCount: "0" },
                    { violation: "recordings.unbound", violationCount: 0 },
                    { violation: "recordings.room_binding_mismatch", violationCount: 0 },
                    { violation: "periodic.room_binding_mismatch", violationCount: 0 },
                ],
                [{ profileKey: profile.key }],
            ]),
        ),
    );
});

test("binding integrity fails closed for unbound rows", async ava => {
    const error = await ava.throwsAsync(() =>
        assertClassroomResourceBindingIntegrity(
            fakeDataSource([[{ violation: "recordings.unbound", violationCount: 1 }], []]),
        ),
    );

    ava.regex(error?.message || "", /recordings\.unbound=1/);
});

test("binding integrity fails closed for unknown profile keys", async ava => {
    const error = await ava.throwsAsync(() =>
        assertClassroomResourceBindingIntegrity(
            fakeDataSource([
                [{ violation: "rooms.unbound", violationCount: 0 }],
                [{ profileKey: "removed-agora-profile" }],
            ]),
        ),
    );

    ava.regex(error?.message || "", /removed-agora-profile/);
});
