import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { oauthSecretsDAO } from "../../../../dao";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { developerOAuthCreateSecret } from "../create-secret";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.developer.oauth.create-secret";
initializeDataSource(test, namespace);

test(`${namespace} - create secret success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthCreateSecret);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/secret/create",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);

    const secretDatum = await oauthSecretsDAO.findOne(t, ["client_secret", "secret_uuid"], {
        oauth_uuid: oauthUUID,
    });

    ava.deepEqual(
        resp.json(),
        successJSON({
            clientSecret: secretDatum?.client_secret,
            secretUUID: secretDatum?.secret_uuid,
        }),
    );

    await releaseRunner();
});
