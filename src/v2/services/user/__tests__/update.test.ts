import test from "ava";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../__tests__/helpers/db";
import { UserUpdateService } from "../update";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { userDAO } from "../../../dao";

const namespace = "v2.services.user.update";
initializeDataSource(test, namespace);

test(`${namespace} - user name`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);

    const info = await createUser.quick();
    const newUserName = v4();

    const userUpdateSVC = new UserUpdateService(ids(), t, info.userUUID);
    await userUpdateSVC.userName(newUserName);

    const result = await userDAO.findOne(t, "user_name", {
        user_uuid: info.userUUID,
    });

    ava.is(result.user_name, newUserName);

    await releaseRunner();
});

test(`${namespace} - avatar url`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);

    const info = await createUser.quick();
    const newAvatarURL = `https://${v4()}.org/${v4()}.jpg`;

    const userUpdateSVC = new UserUpdateService(ids(), t, info.userUUID);
    await userUpdateSVC.avatarURL(newAvatarURL);

    const result = await userDAO.findOne(t, "avatar_url", {
        user_uuid: info.userUUID,
    });

    ava.is(result.avatar_url, newAvatarURL);

    await releaseRunner();
});
