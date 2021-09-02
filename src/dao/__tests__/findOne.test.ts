import test from "ava";
import { Connection } from "typeorm";
import { orm } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-findOne]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - findOne order`, async ava => {
    const [userUUID, fileUUID1, fileUUID2] = [v4(), "aaa", "bbb"];

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

    const result = await CloudStorageUserFilesDAO().findOne(
        ["file_uuid"],
        {
            user_uuid: userUUID,
        },
        ["file_uuid", "DESC"],
    );

    ava.is(result!.file_uuid, fileUUID2);
});
