import test from "ava";
import { CreateUser } from "../../__tests__/helpers/db/user";
import { useTransaction } from "../../__tests__/helpers/db/query-runner";
import { userDAO } from "../index";
import { dataSource } from "../../../thirdPartyService/TypeORMService";
import { UserModel } from "../../../model/user/User";

const namespace = "dao.delete";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - delete (logical delete)`, async ava => {
    const { userUUID } = await CreateUser.quick();

    const { t, commitTransaction, releaseRunner } = await useTransaction();

    await userDAO.delete(t, {
        user_uuid: userUUID,
    });

    await commitTransaction();
    await releaseRunner();

    const result = await dataSource.getRepository(UserModel).findOne({
        where: {
            user_uuid: userUUID,
        },
    });

    ava.not(result, null);
    ava.is(result!.is_delete, true);
});
