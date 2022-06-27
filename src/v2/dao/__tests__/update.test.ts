import test from "ava";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { userDAO } from "../index";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { v4 } from "uuid";

const namespace = "dao.update";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - no config`, async ava => {
    const { userUUID } = await CreateUser.quick();

    const { t, commitTransaction, releaseRunner } = await useTransaction();

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
    await releaseRunner();

    const result = await userDAO.findOne("user_name", {
        user_uuid: userUUID,
    });

    ava.is(result.user_name, newUserName);
});

test(`${namespace} - limit and order`, async ava => {
    const [userName, password] = [v4(), v4()];
    await Promise.all([
        CreateUser.fixedName(userName),
        CreateUser.fixedName(userName),
        CreateUser.fixedName(userName),
        CreateUser.fixedName(userName),
    ]);

    const { t, commitTransaction, releaseRunner } = await useTransaction();

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
    await releaseRunner();

    const result = await userDAO.find(
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
