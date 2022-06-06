import test from "ava";
import { Connection } from "typeorm";
import { v4 } from "uuid";
import { Status } from "../../../../../constants/Project";
import { orm } from "../../../../../thirdPartyService/TypeORMService";
import { createUploadAvatarStart } from "./helpers";

const namespace = "[api][api-v1][api-user][api-user-upload-avatar]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - start`, async ava => {
    ava.plan(1);

    const userUUID = v4();
    const uploadAvatarStart = createUploadAvatarStart("avatar.png", 1024, userUUID);

    const ret = await uploadAvatarStart.execute();

    ava.is(ret.status, Status.Success);

    // console.log(ret);
});
