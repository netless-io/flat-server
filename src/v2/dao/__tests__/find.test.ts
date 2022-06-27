import test from "ava";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { userDAO } from "../index";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { v4 } from "uuid";
import { In } from "typeorm";

const namespace = "dao.find";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - select is string`, async ava => {
    const userName = v4();
    const { userUUID } = await CreateUser.fixedName(userName);

    const result = await userDAO.find("user_uuid", {
        user_name: userName,
    });

    ava.is(result.length, 1);
    ava.is(result[0].user_uuid, userUUID);
});

test(`${namespace} - select is Array<string>`, async ava => {
    const userName = v4();
    const { userUUID } = await CreateUser.fixedName(userName);

    const result = await userDAO.find(["user_uuid"], {
        user_name: userName,
    });

    ava.is(result.length, 1);
    ava.is(result[0].user_uuid, userUUID);
});

test(`${namespace} - result is empty`, async ava => {
    const result = await userDAO.find(["user_uuid"], {
        user_uuid: v4(),
    });

    ava.is(result.length, 0);
});

test(`${namespace} - order`, async ava => {
    const userName = v4();
    const { userUUID: userUUID1 } = await CreateUser.fixedName(userName);
    const { userUUID: userUUID2 } = await CreateUser.fixedName(userName);
    const { userUUID: userUUID3 } = await CreateUser.fixedName(userName);

    const result = await userDAO.find(
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
});

test(`${namespace} - distinct`, async ava => {
    const userName = v4();
    const { userUUID: userUUID1 } = await CreateUser.fixedName(userName);
    const { userUUID: userUUID2 } = await CreateUser.fixedName(userName);

    const result = await userDAO.find(
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
});

test(`${namespace} - limit`, async ava => {
    const userName = v4();
    const { userUUID: userUUID1 } = await CreateUser.fixedName(userName);
    await CreateUser.fixedName(userName);

    const result = await userDAO.find(
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
});
