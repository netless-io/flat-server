import test from "ava";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { UserInfoService } from "../info";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { testService } from "../../../__tests__/helpers/db";

const namespace = "v2.services.user.info";
initializeDataSource(test, namespace);

test(`${namespace} - user not found in basic info`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    await ava.throwsAsync(() => new UserInfoService(ids(), t, v4()).basicInfo(), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.UserNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - user found in basic info`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);

    const userInfo = await createUser.quick();

    const result = await new UserInfoService(ids(), t, userInfo.userUUID).basicInfo();

    ava.deepEqual(result, {
        userName: userInfo.userName,
        userPassword: userInfo.userPassword,
        avatarURL: userInfo.avatarURL,
    });

    await releaseRunner();
});
