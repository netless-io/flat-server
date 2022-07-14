import test from "ava";
import { userDAO } from "../index";
import { v4 } from "uuid";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.insert";

initializeDataSource(test, namespace);

test(`${namespace} - commit`, async ava => {
    const { t, commitTransaction } = await useTransaction();

    const [userUUID, userName] = [v4(), v4()];

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await commitTransaction();

    const { user_name } = await userDAO.findOne(t, "user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, userName);
});

test(`${namespace} - rollback`, async ava => {
    const { t, rollbackTransaction } = await useTransaction();

    const [userUUID, userName] = [v4(), v4()];

    await userDAO.insert(t, {
        user_uuid: userUUID,
        user_name: userName,
        user_password: "",
        avatar_url: "",
    });

    await rollbackTransaction();

    const { user_name } = await userDAO.findOne(t, "user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, undefined);
});

test(`${namespace} - orIgnore`, async ava => {
    const { t, commitTransaction } = await useTransaction();

    const [userUUID, userName] = [v4(), v4()];

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

    const { user_name } = await userDAO.findOne(t, "user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, userName);
});

test(`${namespace} - orUpdate`, async ava => {
    const { t, commitTransaction } = await useTransaction();

    const [userUUID, userName, newUserName] = [v4(), v4(), v4()];

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

    const { user_name } = await userDAO.findOne(t, "user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, newUserName);
});
