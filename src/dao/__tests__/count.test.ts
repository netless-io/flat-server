import test from "ava";
import { Connection } from "typeorm";
import { orm } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-count]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - count`, async ava => {
    const userUUID = v4();

    await CloudStorageUserFilesDAO().insert([
        {
            user_uuid: userUUID,
            file_uuid: v4(),
        },
        {
            user_uuid: userUUID,
            file_uuid: v4(),
        },
        {
            user_uuid: v4(),
            file_uuid: v4(),
        },
    ]);

    const result = await CloudStorageUserFilesDAO().count({
        user_uuid: userUUID,
    });

    ava.is(result, 2);
});
