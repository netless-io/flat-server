import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { userRouters } from "../../routes";
import { userRename } from "../index";
import { v4 } from "uuid";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.user.rename";
initializeDataSource(test, namespace);

test.serial(`${namespace} - rename success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);
    const { userUUID } = await createUser.quick();
    await commitTransaction();
    await releaseRunner();

    const newUserName = v4();

    // @ts-ignore
    const useOnceService = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
    });

    const helpAPI = new HelperAPI();
    await helpAPI.import(userRouters, userRename);
    const resp = await helpAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/user/rename",
        payload: {
            newUserName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    useOnceService.restore();
});
