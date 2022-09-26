import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { failJSON, successJSON } from "../../../internal/utils/response-json";
import { developerOAuthSettingDetail } from "../setting-detail";
import { v4 } from "uuid";
import { ErrorCode } from "../../../../../ErrorCode";

const namespace = "v2.controllers.developer.oauth.info";

initializeDataSource(test, namespace);

test.serial(`${namespace} - info success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createOAuthUsers, createSecretsInfos } = testService(t);

    const {
        oauthUUID,
        clientID,
        appName,
        appDesc,
        scopes,
        homepageURL,
        callbacksURL,
        logoURL,
        ownerUUID,
    } = await createOAuthInfos.quick();
    const [, , secretInfo] = await Promise.all([
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createSecretsInfos.quick({
            oauthUUID,
        }),
    ]);

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthSettingDetail);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/setting/detail",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    const respJSON = resp.json();
    ava.deepEqual(
        respJSON,
        successJSON({
            appName,
            appDesc,
            scopes,
            homepageURL,
            callbacksURL,
            logoURL,
            clientID,
            userCount: 2,
            secrets: [
                {
                    secretUUID: secretInfo.secretUUID,
                    clientSecret: `******${secretInfo.clientSecret.slice(-8)}`,
                    createdAt: respJSON.data.secrets[0].createdAt,
                },
            ],
        }),
    );
});

test.serial(`${namespace} - info - not owner`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthSettingDetail);
    const resp = await helperAPI.injectAuth(v4(), {
        method: "POST",
        url: "/v2/developer/oauth/setting/detail",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.OAuthUUIDNotFound));
});
