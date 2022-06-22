import test from "ava";
import { dataSource } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-find]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - find order`, async ava => {
    const [userUUID, fileUUID1, fileUUID2] = [v4(), "ccc", "ddd"];

    await CloudStorageUserFilesDAO().insert([
        {
            user_uuid: userUUID,
            file_uuid: fileUUID1,
        },
        {
            user_uuid: userUUID,
            file_uuid: fileUUID2,
        },
    ]);

    const result = (
        await CloudStorageUserFilesDAO().find(
            ["file_uuid"],
            {
                user_uuid: userUUID,
            },
            {
                order: ["file_uuid", "DESC"],
            },
        )
    ).map(data => data.file_uuid);

    ava.true(Array.isArray(result), "result should is array");
    ava.is(result.length, 2, "array length should is 2");
    ava.is(result[0], fileUUID2);
    ava.is(result[1], fileUUID1);
});

test(`${namespace} - find distinct`, async ava => {
    const [userUUID, fileUUID1, fileUUID2] = [v4(), v4(), v4()];

    await CloudStorageUserFilesDAO().insert([
        {
            user_uuid: userUUID,
            file_uuid: fileUUID1,
            version: 1,
        },
        {
            user_uuid: userUUID,
            file_uuid: fileUUID2,
            version: 1,
        },
    ]);

    const result = await CloudStorageUserFilesDAO().find(
        ["version"],
        {
            user_uuid: userUUID,
        },
        {
            distinct: true,
        },
    );

    ava.is(result[0].version, 1);
});
