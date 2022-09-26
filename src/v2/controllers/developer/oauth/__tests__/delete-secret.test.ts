import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { v4 } from "uuid";
import { failJSON } from "../../../internal/utils/response-json";
import { ErrorCode } from "../../../../../ErrorCode";
import { oauthSecretsDAO } from "../../../../dao";
import { developerOAuthDeleteSecret } from "../delete-secret";

const namespace = "v2.controllers.developer.oauth.deleteSecret";
initializeDataSource(test, namespace);

test(`${namespace} - success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createSecretsInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();
    const { secretUUID } = await createSecretsInfos.quick({
        oauthUUID,
    });

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthDeleteSecret);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/secret/delete",
        payload: {
            secretUUID,
        },
    });

    ava.is(resp.statusCode, 200);

    ava.is(
        await oauthSecretsDAO.count(t, {
            oauth_uuid: oauthUUID,
        }),
        0,
    );

    await releaseRunner();
});

test(`${namespace} - not owner`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createSecretsInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();
    const { secretUUID } = await createSecretsInfos.quick({
        oauthUUID,
    });

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthDeleteSecret);
    const resp = await helperAPI.injectAuth(v4(), {
        method: "POST",
        url: "/v2/developer/oauth/secret/delete",
        payload: {
            secretUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.OAuthUUIDNotFound));

    ava.is(await oauthSecretsDAO.count(t, { oauth_uuid: oauthUUID }), 1);

    await releaseRunner();
});
