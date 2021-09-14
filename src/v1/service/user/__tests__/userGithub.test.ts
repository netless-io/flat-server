import test from "ava";
import { orm } from "../../../../thirdPartyService/TypeORMService";
import { Connection } from "typeorm";
import { UserGithubDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { ServiceUserGithub } from "../UserGithub";

const namespace = "[service][service-user][service-user-github]";

let connection: Connection;
test.before(`${namespace} - connection orm`, async () => {
    connection = await orm();
});

test.after(`${namespace} - close orm`, async () => {
    await connection.close();
});

test(`${namespace} - assert exist`, async ava => {
    const [userUUID, unionUUID] = [v4(), v4()];

    await UserGithubDAO().insert({
        user_uuid: userUUID,
        user_name: "test_name_github",
        union_uuid: unionUUID.slice(0, 32),
    });

    const serviceUserGithub = new ServiceUserGithub(userUUID);

    await ava.notThrowsAsync(serviceUserGithub.assertExist());
});

test(`${namespace} - assert exist failed`, async ava => {
    const serviceUserGithub = new ServiceUserGithub(v4());

    const rawError = await ava.throwsAsync<ControllerError>(serviceUserGithub.assertExist());

    ava.is(rawError.errorCode, ErrorCode.UserNotFound);
});
