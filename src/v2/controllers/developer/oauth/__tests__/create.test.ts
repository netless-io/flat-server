import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { developerOAuthRouters } from "../../routes";
import { v4 } from "uuid";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { developerOAuthCreate } from "../create";
import { DeveloperOAuthScope } from "../../../../../model/oauth/oauth-infos";
import { Status } from "../../../../../constants/Project";

const namespace = "v2.controllers.developer.oauth.create";

initializeDataSource(test, namespace);

test.serial(`${namespace} - create success`, async ava => {
    // @ts-ignore
    const complianceTextStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
    });

    const userUUID = v4();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthCreate);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/developer/oauth/create",
        payload: {
            appName: v4().slice(10),
            appDesc: v4(),
            scopes: [DeveloperOAuthScope.UserNameRead],
            callbacksURL: [`https://${v4()}.com`],
            homepageURL: `https://${v4()}.com`,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.is(resp.json().status, Status.Success);
    ava.truthy(resp.json().data.oauthUUID);

    complianceTextStub.restore();
});
