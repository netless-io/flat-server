import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserGithubDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserGithub } from "../UserGithub";

const namespace = "[service][service-user][service-user-github]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - create github user`, async ava => {
    const [userUUID, userName, unionUUID] = [v4(), v4(), v4().slice(0, 32)];

    const serviceUserGithub = new ServiceUserGithub(userUUID);

    await serviceUserGithub.create({
        userName,
        unionUUID,
    });

    const result = await UserGithubDAO().findOne(["union_uuid"], {
        user_uuid: userUUID,
    });

    ava.not(result, undefined);

    ava.is(result?.union_uuid, unionUUID);
});

test(`${namespace} - assert exist`, async ava => {
    const userUUID = v4();

    await UserGithubDAO().insert({
        user_uuid: userUUID,
        user_name: "test_name_github",
        union_uuid: v4().slice(0, 32),
    });

    const serviceUserGithub = new ServiceUserGithub(userUUID);

    await ava.notThrowsAsync(serviceUserGithub.assertExist());
});

test(`${namespace} - assert exist failed`, async ava => {
    const serviceUserGithub = new ServiceUserGithub(v4());

    const rawError = await ava.throwsAsync<ControllerError>(serviceUserGithub.assertExist());

    ava.is(rawError?.errorCode, ErrorCode.UserNotFound);
});

test(`${namespace} - get userUUID by unionUUID`, async ava => {
    const [userUUID, unionUUID] = [v4(), v4().slice(0, 32)];

    await UserGithubDAO().insert({
        user_uuid: userUUID,
        user_name: v4(),
        union_uuid: unionUUID,
    });

    const result = await ServiceUserGithub.userUUIDByUnionUUID(unionUUID);

    ava.is(result, userUUID);
});

test(`${namespace} - not found userUUID by unionUUID`, async ava => {
    const result = await ServiceUserGithub.userUUIDByUnionUUID(v4().slice(0, 32));

    ava.is(result, null);
});
