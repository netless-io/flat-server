import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { applicationRouters } from "../../routes";
import { applicationDetail } from "../index";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.application.detail";
initializeDataSource(test, namespace);

test(`${namespace} - detail`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createUser, createOAuthUsers } = testService(t);

    const { userUUID: ownerUUID, userName: ownerName } = await createUser.quick();

    const createData = await createOAuthInfos.quick({
        ownerUUID,
    });

    const { userUUID } = await createOAuthUsers.quick({
        oauthUUID: createData.oauthUUID,
    });

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(applicationRouters, applicationDetail);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/application/detail",
        payload: {
            oauthUUID: createData.oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(
        resp.json(),
        successJSON({
            ownerName,
            appName: createData.appName,
            appDesc: createData.appDesc,
            homepageURL: createData.homepageURL,
            logoURL: createData.logoURL,
            scopes: createData.scopes,
        }),
    );
});
