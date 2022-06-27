import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { userDAO } from "../index";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { UserModel } from "../../../model/user/User";

const namespace = "dao.deleteHard";

test(`${namespace} - delete (physical delete)`, async ava => {
    const { userUUID } = await CreateUser.quick();

    const { t, commitTransaction, releaseRunner } = await useTransaction();

    await userDAO.deleteHard(t, {
        user_uuid: userUUID,
    });

    await commitTransaction();
    await releaseRunner();

    const result = await dataSource.getRepository(UserModel).findOne({
        where: {
            user_uuid: userUUID,
        },
    });

    ava.is(result, null);
});
