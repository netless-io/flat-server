import test from "ava";
import { dataSource } from "../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageUserFilesDAO } from "./..";

const namespace = "[dao][dao-count]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
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
