import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { v4 } from "uuid";
import { DeveloperOAuthScope } from "../../../../../model/oauth/oauth-infos";
import { developerOAuthUpdate } from "../update";
import { successJSON } from "../../../internal/utils/response-json";
import { oauthInfosDAO } from "../../../../dao";

const namespace = "v2.controllers.developer.oauth.update";
initializeDataSource(test, namespace);

test.serial(`${namespace} - update oauth info`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);
    const oldOauthInfo = await createOAuthInfos.quick();
    await commitTransaction();

    // @ts-ignore
    const complianceTextStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
    });

    const newOAuthInfo = {
        oauthUUID: oldOauthInfo.oauthUUID,
        appName: v4().slice(10),
        appDesc: v4(),
        scopes: [DeveloperOAuthScope.UserUUIDRead],
        callbacksURL: [`https://${v4()}.com`],
        homepageURL: `https://${v4()}.com`,
    };

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthUpdate);
    const resp = await helperAPI.injectAuth(oldOauthInfo.ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/update",
        payload: newOAuthInfo,
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    const result = await oauthInfosDAO.findOne(
        t,
        ["app_name", "app_desc", "scopes", "callbacks_url", "homepage_url"],
        {
            oauth_uuid: oldOauthInfo.oauthUUID,
        },
    );

    ava.deepEqual(
        {
            app_name: result?.app_name,
            app_desc: result?.app_desc,
            scopes: result?.scopes,
            callbacks_url: result?.callbacks_url,
            homepage_url: result?.homepage_url,
        },
        {
            app_name: newOAuthInfo.appName,
            app_desc: newOAuthInfo.appDesc,
            scopes: newOAuthInfo.scopes.join(" "),
            callbacks_url: newOAuthInfo.callbacksURL.join(" "),
            homepage_url: newOAuthInfo.homepageURL,
        },
    );

    complianceTextStub.restore();
    await releaseRunner();
});
