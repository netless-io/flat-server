import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { userDAO } from "../index";
import { UserModel } from "../../../model/user/User";
import { initializeDataSource } from "../../__tests__/helpers/db/test-hooks";

const namespace = "dao.deleteHard";

initializeDataSource(test, namespace);

test(`${namespace} - delete (physical delete)`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const createUser = new CreateUser(t);

    const { userUUID } = await createUser.quick();

    await userDAO.deleteHard(t, {
        user_uuid: userUUID,
    });

    await commitTransaction();

    const result = await t.getRepository(UserModel).findOne({
        where: {
            user_uuid: userUUID,
        },
    });

    await releaseRunner();

    ava.is(result, null);
});
