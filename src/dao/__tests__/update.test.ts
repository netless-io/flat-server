import test from "ava";
import { Connection } from "typeorm";
import { orm } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-update]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - update normal`, async ava => {
    const userUUID = v4();
    const fileUUID = v4();

    await CloudStorageUserFilesDAO().insert([
        {
            user_uuid: userUUID,
            file_uuid: v4(),
        },
    ]);

    await CloudStorageUserFilesDAO().update(
        {
            file_uuid: fileUUID,
        },
        {
            user_uuid: userUUID,
        },
    );

    const result = await CloudStorageUserFilesDAO().findOne(["file_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(result!.file_uuid, fileUUID);
});

test(`${namespace} - update order and limit`, async ava => {
    const [userUUID, fileUUID1, fileUUID2, newFileUUID] = [v4(), "eee", "fff", "ggg"];

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

    await CloudStorageUserFilesDAO().update(
        {
            file_uuid: newFileUUID,
        },
        {
            user_uuid: userUUID,
        },
        ["file_uuid", "DESC"],
        1,
    );

    const result = await CloudStorageUserFilesDAO().findOne(
        ["file_uuid"],
        {
            user_uuid: userUUID,
        },
        ["file_uuid", "DESC"],
    );

    ava.is(result!.file_uuid, newFileUUID);
});
