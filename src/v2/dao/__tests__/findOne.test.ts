import test from "ava";
import { userDAO } from "../index";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { v4 } from "uuid";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.findOne";

initializeDataSource(test, namespace);

test(`${namespace} - select is string`, async ava => {
    const { userUUID } = await CreateUser.quick();
    const { user_uuid } = await userDAO.findOne("user_uuid", {
        user_uuid: userUUID,
    });

    ava.is(user_uuid, userUUID);
});

test(`${namespace} - select is Array<string>`, async ava => {
    const { userUUID } = await CreateUser.quick();
    const { user_uuid } = await userDAO.findOne(["user_uuid"], {
        user_uuid: userUUID,
    });

    ava.is(user_uuid, userUUID);
});

test(`${namespace} - result is empty`, async ava => {
    const { user_uuid } = await userDAO.findOne(["user_uuid"], {
        user_uuid: v4(),
    });

    ava.is(user_uuid, undefined);
});

test(`${namespace} - order`, async ava => {
    const userName = v4();
    await CreateUser.fixedName(userName);
    const { userUUID } = await CreateUser.fixedName(userName);

    const { user_uuid } = await userDAO.findOne(
        "user_uuid",
        {
            user_name: userName,
        },
        ["created_at", "DESC"],
    );

    ava.is(user_uuid, userUUID);
});
