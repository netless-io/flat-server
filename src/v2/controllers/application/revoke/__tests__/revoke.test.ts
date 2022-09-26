import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { v4 } from "uuid";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { applicationRouters } from "../../routes";
import { applicationRevoke } from "../index";
import { oauthUsersDAO } from "../../../../dao";

const namespace = "v2.controllers.application.revoke";
initializeDataSource(test, namespace);

test(`${namespace} - revoke`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthUsers } = testService(t);

    const userUUID = v4();
    const { oauthUUID } = await createOAuthUsers.quick({
        userUUID,
    });

    await commitTransaction();

    ava.is(await oauthUsersDAO.count(t, { user_uuid: userUUID }), 1);

    const helperAPI = new HelperAPI();
    await helperAPI.import(applicationRouters, applicationRevoke);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/application/revoke",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.is(await oauthUsersDAO.count(t, { user_uuid: userUUID }), 0);

    await releaseRunner();
});
