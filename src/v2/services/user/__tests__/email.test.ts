import test from "ava";
import { v4 } from "uuid";
import { Status } from "../../../../constants/Project";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import RedisService from "../../../../thirdPartyService/RedisService";
import { hash } from "../../../../utils/Hash";
import { RedisKey } from "../../../../utils/Redis";
import { MessageExpirationSecond } from "../../../constants";
import { userDAO, userEmailDAO } from "../../../dao";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { UserEmailService } from "../email";

const namespace = "v2.services.user.email";
initializeDataSource(test, namespace);

test(`${namespace} - user already registered in send message`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    const userInfo = await createUser.quick();
    const userEmailInfo = await createUserEmail.quick(userInfo);

    await ava.throwsAsync(
        () => new UserEmailService(ids(), t).sendMessageForRegister(userEmailInfo.userEmail),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.EmailAlreadyExist}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user not found in send message for reset`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    await ava.throwsAsync(
        () => new UserEmailService(ids(), t).sendMessageForReset(`${v4()}@test.com`),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserNotFound}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user email already registered`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    const userInfo = await createUser.quick();
    const userEmailInfo = await createUserEmail.quick(userInfo);

    RedisService.set(
        RedisKey.emailRegisterOrReset(userEmailInfo.userEmail),
        "666666",
        MessageExpirationSecond,
    );

    await ava.throwsAsync(
        () =>
            new UserEmailService(ids(), t).register(
                userEmailInfo.userEmail,
                666666,
                v4(),
                async () => "",
            ),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.EmailAlreadyExist}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user email register success`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const email = `${v4()}@test.com`;
    RedisService.set(RedisKey.emailRegisterOrReset(email), "666666", MessageExpirationSecond);

    const password = v4();
    const { userUUID } = await new UserEmailService(ids(), t).register(
        email,
        666666,
        password,
        async () => "",
    );

    const userInfo = await userDAO.findOne(t, ["user_password"], { user_uuid: userUUID });
    ava.not(userInfo, null);
    ava.is(userInfo?.user_password, hash(password));

    const userEmailInfo = await userEmailDAO.findOne(t, ["id"], { user_email: email });
    ava.not(userEmailInfo, null);

    await releaseRunner();
});

test(`${namespace} - user email not found in reset`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const email = `${v4()}@test.com`;
    RedisService.set(RedisKey.emailRegisterOrReset(email), "666666", MessageExpirationSecond);

    const password = v4();

    await ava.throwsAsync(() => new UserEmailService(ids(), t).reset(email, 666666, password), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.UserNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - user email reset success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    const userInfo = await createUser.quick();
    const userEmailInfo = await createUserEmail.quick(userInfo);

    RedisService.set(
        RedisKey.emailRegisterOrReset(userEmailInfo.userEmail),
        "666666",
        MessageExpirationSecond,
    );

    const password = v4();

    await new UserEmailService(ids(), t).reset(userEmailInfo.userEmail, 666666, password);

    const newUserInfo = await userDAO.findOne(t, ["user_password"], {
        user_uuid: userInfo.userUUID,
    });
    ava.not(newUserInfo, null);
    ava.is(newUserInfo?.user_password, hash(password));

    await releaseRunner();
});

test(`${namespace} - user email not found in login`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    await ava.throwsAsync(
        () => new UserEmailService(ids(), t).login(`${v4()}@test.com`, v4(), async () => ""),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserOrPasswordIncorrect}`,
        },
    );

    const userInfo = await createUser.quick({ userPassword: "" });
    const userEmailInfo = await createUserEmail.quick(userInfo);

    await ava.throwsAsync(
        () => new UserEmailService(ids(), t).login(userEmailInfo.userEmail, v4(), async () => ""),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserOrPasswordIncorrect}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user email wrong password`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    const userInfo = await createUser.quick();
    const userEmailInfo = await createUserEmail.quick(userInfo);

    await ava.throwsAsync(
        () => new UserEmailService(ids(), t).login(userEmailInfo.userEmail, v4(), async () => ""),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserOrPasswordIncorrect}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user email login success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserEmail } = testService(t);

    const password = v4();
    const userInfo = await createUser.quick({ userPassword: hash(password) });
    const userEmailInfo = await createUserEmail.quick(userInfo);

    const result = await new UserEmailService(ids(), t).login(
        userEmailInfo.userEmail,
        password,
        async () => "",
    );

    ava.is(result.userUUID, userInfo.userUUID);

    await releaseRunner();
});
