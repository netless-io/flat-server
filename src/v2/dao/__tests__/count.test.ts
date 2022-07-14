import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { userDAO } from "../index";
import { v4 } from "uuid";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.count";

initializeDataSource(test, namespace);

test(`${namespace} - remove`, async ava => {
    const userName = v4();
    await Promise.all([
        CreateUser.fixedName(userName),
        CreateUser.fixedName(userName),
        CreateUser.fixedName(userName),
    ]);

    const count = await userDAO.count({
        user_name: userName,
    });

    ava.is(count, 3);
});
