import test from "ava";
import { userDAO } from "../index";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { v4 } from "uuid";
import { In } from "typeorm";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.find";

initializeDataSource(test, namespace);

test(`${namespace} - select is string`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    const { userUUID } = await createUser.fixedName(userName);

    const result = await userDAO.find(t, "user_uuid", {
        user_name: userName,
    });

    ava.is(result.length, 1);
    ava.is(result[0].user_uuid, userUUID);

    await releaseRunner();
});

test(`${namespace} - select is Array<string>`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    const { userUUID } = await createUser.fixedName(userName);

    const result = await userDAO.find(t, ["user_uuid"], {
        user_name: userName,
    });

    ava.is(result.length, 1);
    ava.is(result[0].user_uuid, userUUID);

    await releaseRunner();
});

test(`${namespace} - result is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const result = await userDAO.find(t, ["user_uuid"], {
        user_uuid: v4(),
    });

    ava.is(result.length, 0);

    await releaseRunner();
});

test(`${namespace} - order`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    const { userUUID: userUUID1 } = await createUser.fixedName(userName);
    const { userUUID: userUUID2 } = await createUser.fixedName(userName);
    const { userUUID: userUUID3 } = await createUser.fixedName(userName);

    const result = await userDAO.find(
        t,
        "user_uuid",
        {
            user_name: userName,
        },
        {
            order: ["created_at", "DESC"],
        },
    );

    ava.is(result.length, 3);
    ava.is(result[0].user_uuid, userUUID3);
    ava.is(result[1].user_uuid, userUUID2);
    ava.is(result[2].user_uuid, userUUID1);

    await releaseRunner();
});

test(`${namespace} - distinct`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    const { userUUID: userUUID1 } = await createUser.fixedName(userName);
    const { userUUID: userUUID2 } = await createUser.fixedName(userName);

    const result = await userDAO.find(
        t,
        "user_name",
        {
            user_uuid: In([userUUID1, userUUID2]),
        },
        {
            distinct: true,
        },
    );

    ava.is(result.length, 1);
    ava.is(result[0].user_name, userName);

    await releaseRunner();
});

test(`${namespace} - limit`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    const { userUUID: userUUID1 } = await createUser.fixedName(userName);
    await createUser.fixedName(userName);

    const result = await userDAO.find(
        t,
        "user_uuid",
        {
            user_name: userName,
        },
        {
            limit: 1,
        },
    );

    ava.is(result.length, 1);
    ava.is(result[0].user_uuid, userUUID1);

    await releaseRunner();
});

test(`${namespace} - offset`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    await Promise.all([Array.from({ length: 5 }, () => createUser.fixedName(userName))]);

    const result = await userDAO.find(
        t,
        "user_uuid",
        {
            user_name: userName,
        },
        {
            offset: 2,
            limit: 2,
        },
    );

    ava.is(result.length, 2);

    await releaseRunner();
});
