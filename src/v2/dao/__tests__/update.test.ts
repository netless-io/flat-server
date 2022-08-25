import test from "ava";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { userDAO } from "../index";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { v4 } from "uuid";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.update";

initializeDataSource(test, namespace);

test(`${namespace} - no config`, async ava => {
    const { t, commitTransaction } = await useTransaction();
    const createUser = new CreateUser(t);

    const { userUUID } = await createUser.quick();

    const newUserName = v4();
    await userDAO.update(
        t,
        {
            user_name: newUserName,
        },
        {
            user_uuid: userUUID,
        },
    );

    await commitTransaction();

    const { user_name } = await userDAO.findOne(t, "user_name", {
        user_uuid: userUUID,
    });

    ava.is(user_name, newUserName);
});

test(`${namespace} - limit and order`, async ava => {
    const { t, commitTransaction } = await useTransaction();
    const createUser = new CreateUser(t);

    const [userName, password] = [v4(), v4()];
    await Promise.all([
        createUser.fixedName(userName),
        createUser.fixedName(userName),
        createUser.fixedName(userName),
        createUser.fixedName(userName),
    ]);

    await userDAO.update(
        t,
        {
            is_delete: false,
        },
        {
            is_delete: false,
        },
    );

    await userDAO.update(
        t,
        {
            user_password: password,
        },
        {
            user_name: userName,
        },
        {
            limit: 2,
            order: ["created_at", "ASC"],
        },
    );

    await commitTransaction();

    const result = await userDAO.find(
        t,
        ["user_uuid", "user_password"],
        {
            user_name: userName,
        },
        {
            order: ["created_at", "ASC"],
        },
    );

    ava.is(result.length, 4);
    ava.is(result[0].user_password, password);
    ava.is(result[1].user_password, password);
    ava.not(result[2].user_password, password);
    ava.not(result[3].user_password, password);
});
