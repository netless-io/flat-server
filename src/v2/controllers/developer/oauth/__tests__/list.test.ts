import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { v4 } from "uuid";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { developerOAuthList } from "../list";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.developer.oauth.list";
initializeDataSource(test, namespace);

test(`${namespace} - list`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const userUUID = v4();

    const o1 = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });
    const o2 = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });
    const o3 = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthList);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/developer/oauth/list",
        payload: {
            page: 1,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(
        resp.json(),
        successJSON([
            {
                oauthUUID: o3.oauthUUID,
                appName: o3.appName,
                logoURL: o3.logoURL,
            },
            {
                oauthUUID: o2.oauthUUID,
                appName: o2.appName,
                logoURL: o2.logoURL,
            },
            {
                oauthUUID: o1.oauthUUID,
                appName: o1.appName,
                logoURL: o1.logoURL,
            },
        ]),
    );
});
