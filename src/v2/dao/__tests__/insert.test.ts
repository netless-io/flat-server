import test from "ava";
import { userDAO } from "../index";
import { v4 } from "uuid";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.insert";

initializeDataSource(test, namespace);

test(`${namespace} - commit`, async ava => {
    const [userUUID, userName] = [v4(), v4()];

    const { t, commitTransaction, releaseRunner } = await useTransaction();

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await commitTransaction();
    await releaseRunner();

    const { user_name } = await userDAO.findOne("user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, userName);
});

test(`${namespace} - rollback`, async ava => {
    const [userUUID, userName] = [v4(), v4()];

    const { t, rollbackTransaction, releaseRunner } = await useTransaction();

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await rollbackTransaction();
    await releaseRunner();

    const { user_name } = await userDAO.findOne("user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, undefined);
});

test(`${namespace} - orIgnore`, async ava => {
    const [userUUID, userName] = [v4(), v4()];

    const { t, commitTransaction, releaseRunner } = await useTransaction();

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await userDAO.insert(
        t,
        {
            user_uuid: userUUID,
            user_name: "test",
            user_password: "",
            avatar_url: "",
        },
        {
            orIgnore: true,
        },
    );

    await commitTransaction();
    await releaseRunner();

    const { user_name } = await userDAO.findOne("user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, userName);
});

test(`${namespace} - orUpdate`, async ava => {
    const [userUUID, userName, newUserName] = [v4(), v4(), v4()];

    const { t, commitTransaction, releaseRunner } = await useTransaction();

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await userDAO.insert(
        t,
        {
            user_uuid: userUUID,
            user_name: newUserName,
            user_password: "",
            avatar_url: "",
        },
        {
            orUpdate: ["user_name"],
        },
    );

    await commitTransaction();
    await releaseRunner();

    const { user_name } = await userDAO.findOne("user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, newUserName);
});
