import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { userDAO } from "../index";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";

const namespace = "dao.count";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

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
