import test from "ava";
import { dataSource } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-findOne]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
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
