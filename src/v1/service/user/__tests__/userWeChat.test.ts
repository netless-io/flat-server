import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserWeChatDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserWeChat } from "../UserWeChat";
import { ServiceUserGithub } from "../UserGithub";

const namespace = "[service][service-user][service-user-wechat]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - create wechat user`, async ava => {
    const [userUUID, userName, unionUUID, openUUID] = [v4(), v4(), v4(), v4()];

    const serviceUserWeChat = new ServiceUserWeChat(userUUID);

    await serviceUserWeChat.create({
        userName,
        unionUUID,
        openUUID,
    });

    const result = await UserWeChatDAO().findOne(["user_name", "union_uuid", "open_uuid"], {
        user_uuid: userUUID,
    });

    ava.not(result, undefined);
    ava.is(result?.user_name, userName);
    ava.is(result?.open_uuid, openUUID);
    ava.is(result?.union_uuid, unionUUID);
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

    ava.is(rawError?.errorCode, ErrorCode.UserNotFound);
});

test(`${namespace} - get userUUID by unionUUID`, async ava => {
    const [userUUID, openUUID, unionUUID] = [v4(), v4(), v4()];

    await UserWeChatDAO().insert({
        user_uuid: userUUID,
        user_name: v4(),
        union_uuid: unionUUID,
        open_uuid: openUUID,
    });

    const result = await ServiceUserWeChat.userUUIDByUnionUUID(unionUUID);

    ava.is(result, userUUID);
});

test(`${namespace} - not found userUUID by unionUUID`, async ava => {
    const result = await ServiceUserGithub.userUUIDByUnionUUID(v4());

    ava.is(result, null);
});
