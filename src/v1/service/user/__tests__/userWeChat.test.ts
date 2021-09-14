import test from "ava";
import { orm } from "../../../../thirdPartyService/TypeORMService";
import { Connection } from "typeorm";
import { UserWeChatDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserWeChat } from "../UserWeChat";

const namespace = "[service][service-user][service-user-wechat]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - assert exist`, async ava => {
    const [userUUID, unionUUID, openUUID] = [v4(), v4(), v4()];

    await UserWeChatDAO().insert({
        user_uuid: userUUID,
        user_name: "test_name_github",
        union_uuid: unionUUID,
        open_uuid: openUUID,
    });

    const serviceUserWeChat = new ServiceUserWeChat(userUUID);

    await ava.notThrowsAsync(serviceUserWeChat.assertExist());
});

test(`${namespace} - assert exist failed`, async ava => {
    const serviceUserWeChat = new ServiceUserWeChat(v4());

    const rawError = await ava.throwsAsync<ControllerError>(serviceUserWeChat.assertExist());

    ava.is(rawError.errorCode, ErrorCode.UserNotFound);
});
