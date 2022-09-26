import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { v4 } from "uuid";
import { failJSON } from "../../../internal/utils/response-json";
import { ErrorCode } from "../../../../../ErrorCode";
import { oauthInfosDAO, oauthSecretsDAO } from "../../../../dao";
import { developerOAuthDelete } from "../delete";

const namespace = "v2.controllers.developer.oauth.delete";
initializeDataSource(test, namespace);

test(`${namespace} - success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthDelete);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/delete",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);

    ava.is(
        await oauthInfosDAO.count(t, {
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
    await createSecretsInfos.quick({
        oauthUUID,
    });

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthDelete);
    const resp = await helperAPI.injectAuth(v4(), {
        method: "POST",
        url: "/v2/developer/oauth/delete",
        payload: {
            oauthUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.OAuthUUIDNotFound));

    ava.is(await oauthSecretsDAO.count(t, { oauth_uuid: oauthUUID }), 1);
    ava.is(await oauthInfosDAO.count(t, { oauth_uuid: oauthUUID }), 1);

    await releaseRunner();
});
