import test from "ava";
import { dataSource } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-insert]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - insert normal and findOne for normal`, async ava => {
    const [userUUID, fileUUID] = [v4(), v4()];

    await CloudStorageUserFilesDAO().insert({
        user_uuid: userUUID,
        file_uuid: fileUUID,
    });

    const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(result!.file_uuid, fileUUID);
});

test(`${namespace} - insert orUpdate`, async ava => {
    const [userUUID, fileUUID, newFileUUID] = [v4(), v4(), v4()];

    await CloudStorageUserFilesDAO().insert({
        user_uuid: userUUID,
        file_uuid: fileUUID,
    });

    await CloudStorageUserFilesDAO().insert(
        {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        },
        {
            orUpdate: {
                file_uuid: newFileUUID,
            },
        },
    );

    const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(result!.file_uuid, newFileUUID);
});

test(`${namespace} - insert orIgnore`, async ava => {
    const [userUUID, fileUUID] = [v4(), v4(), v4()];

    await CloudStorageUserFilesDAO().insert({
        user_uuid: userUUID,
        file_uuid: fileUUID,
    });

    await CloudStorageUserFilesDAO().insert(
        {
            user_uuid: userUUID,
            file_uuid: fileUUID,
            is_delete: true,
        },
        {
            orIgnore: true,
        },
    );

    const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(result!.file_uuid, fileUUID);
});

test(`${namespace} - insert multiple data and find for normal`, async ava => {
    const [userUUID, fileUUID1, fileUUID2] = [v4(), v4(), v4()];

    await CloudStorageUserFilesDAO().insert([
        {
            user_uuid: userUUID,
            file_uuid: fileUUID1,
        },
        {
            user_uuid: userUUID,
            file_uuid: fileUUID2,
        },
        {
            user_uuid: v4(),
            file_uuid: v4(),
        },
    ]);

    const result = (
        await CloudStorageUserFilesDAO().find(["file_uuid"], {
            user_uuid: userUUID,
        })
    ).map(data => data.file_uuid);

    ava.true(Array.isArray(result), "result should is array");
    ava.is(result.length, 2, "array length should is 2");
    ava.is(result[0], fileUUID1);
    ava.is(result[1], fileUUID2);
});
