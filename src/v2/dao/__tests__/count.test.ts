import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { userDAO } from "../index";
import { v4 } from "uuid";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.count";

initializeDataSource(test, namespace);

test(`${namespace} - remove`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const userName = v4();
    await Promise.all([
        createUser.fixedName(userName),
        createUser.fixedName(userName),
        createUser.fixedName(userName),
    ]);

    const count = await userDAO.count(t, {
        user_name: userName,
    });

    ava.is(count, 3);

    await releaseRunner();
});
