import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { Schema } from "../../../../__tests__/helpers/schema";
import { developerOAuthRouters } from "../../routes";
import { developerOAuthLogoUploadFinish, developerOAuthLogoUploadStart } from "../oauth-logo";
import { DeveloperOAuthLogoStartReturnSchema } from "../../../../services/developer/oauth/oauth-logo.schema";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { v4 } from "uuid";
import { failJSON, successJSON } from "../../../internal/utils/response-json";
import { ErrorCode } from "../../../../../ErrorCode";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";

const namespace = "v2.controllers.developer.oauth.logo";
initializeDataSource(test, namespace);

test.serial(`${namespace} - upload start`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    await commitTransaction();
    await releaseRunner();

    // @ts-ignore
    const useOnceServiceStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
        policyTemplate: () => ({ policy: "x", signature: "y" }),
        domain: "x",
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthLogoUploadStart);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/logo/upload/start",
        payload: {
            oauthUUID,
            fileName: "x.png",
            fileSize: 20,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.is(Schema.check(DeveloperOAuthLogoStartReturnSchema, resp.json().data), null);

    useOnceServiceStub.restore();
});

test.serial(`${namespace} - upload start - not owner`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();

    await commitTransaction();
    await releaseRunner();

    // @ts-ignore
    const useOnceServiceStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
        policyTemplate: () => ({ policy: "x", signature: "y" }),
        domain: "x",
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthLogoUploadStart);
    const resp = await helperAPI.injectAuth(v4(), {
        method: "POST",
        url: "/v2/developer/oauth/logo/upload/start",
        payload: {
            oauthUUID,
            fileName: "x.png",
            fileSize: 20,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.OAuthUUIDNotFound));

    useOnceServiceStub.restore();
});

test.serial(`${namespace} - upload finish`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    await commitTransaction();
    await releaseRunner();

    // @ts-ignore
    const useOnceServiceStub = stub(sl, "useOnceService").returns({
        domain: "x",
        remove: () => Promise.resolve(void 0),
        assertExists: () => Promise.resolve(void 0),
        assertImageNormal: () => Promise.resolve(),
    });

    const [fileUUID, fileName] = [v4(), "1.png"];

    await RedisService.hmset(
        RedisKey.oauthLogoFileInfo(oauthUUID, fileUUID),
        {
            fileName,
        },
        60 * 20,
    );

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthLogoUploadFinish);
    const resp = await helperAPI.injectAuth(ownerUUID, {
        method: "POST",
        url: "/v2/developer/oauth/logo/upload/finish",
        payload: {
            oauthUUID,
            fileUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    useOnceServiceStub.restore();
});

test(`${namespace} - upload finish - not owner`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerOAuthLogoUploadFinish);
    const resp = await helperAPI.injectAuth(v4(), {
        method: "POST",
        url: "/v2/developer/oauth/logo/upload/finish",
        payload: {
            oauthUUID,
            fileUUID: v4(),
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.OAuthUUIDNotFound));
});
