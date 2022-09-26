import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { v4 } from "uuid";
import { DeveloperOAuthInfoService } from "../oauth-info";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { DeveloperOAuthScope } from "../../../../../model/oauth/oauth-infos";
import { oauthInfosDAO } from "../../../../dao";
import { testService } from "../../../../__tests__/helpers/db";
import { FError } from "../../../../../error/ControllerError";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { Schema } from "../../../../__tests__/helpers/schema";
import { developerOAuthInfoInfoReturnSchema } from "../oauth-info.schema";

const namespace = "v2.services.developer.oauth.oauth-info";
initializeDataSource(test, namespace);

test(`${namespace} - create`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const [appName, appDesc, userUUID, oauthUUID] = [v4().slice(0, 20), v4(), v4(), v4()];

    const developerOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, userUUID);
    await developerOAuthInfoSVC.create({
        appName,
        appDesc,
        homepageURL: "https://flat.io",
        callbacksURL: ["https://flat.io", "https://flat2.io"],
        scopes: [
            DeveloperOAuthScope.UserNameRead,
            DeveloperOAuthScope.UserAvatarRead,
            DeveloperOAuthScope.UserNameRead,
        ],
        oauthUUID,
    });

    const result = (await oauthInfosDAO.findOne(
        t,
        [
            "oauth_uuid",
            "app_name",
            "app_desc",
            "owner_uuid",
            "scopes",
            "homepage_url",
            "callbacks_url",
        ],
        {
            oauth_uuid: oauthUUID,
        },
    ))!;

    ava.is(
        result.scopes,
        `${DeveloperOAuthScope.UserNameRead} ${DeveloperOAuthScope.UserAvatarRead}`,
    );
    ava.is(result.app_name, appName);
    ava.is(result.app_desc, appDesc);
    ava.is(result.owner_uuid, userUUID);
    ava.is(result.homepage_url, "https://flat.io");
    ava.is(result.callbacks_url, "https://flat.io https://flat2.io");

    await releaseRunner();
});

test(`${namespace} - delete`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, ownerUUID);
    await DeveloperOAuthInfoSVC.delete(oauthUUID);

    const result = await oauthInfosDAO.findOne(t, ["id"], {
        oauth_uuid: oauthUUID,
    });

    ava.is(result, null);
    await releaseRunner();
});

test(`${namespace} - update`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, ownerUUID);
    const newConfig = {
        scopes: [DeveloperOAuthScope.UserAvatarRead],
        callbacksURL: ["https://flat.io"],
        appDesc: v4(),
        appName: v4().slice(0, 20),
        homepageURL: "https://flat.io",
    };
    await DeveloperOAuthInfoSVC.update({
        oauthUUID,
        ...newConfig,
    });

    const result = (await oauthInfosDAO.findOne(
        t,
        ["scopes", "callbacks_url", "app_desc", "app_name", "homepage_url"],
        {
            oauth_uuid: oauthUUID,
        },
    ))!;

    ava.is(result.scopes, `${DeveloperOAuthScope.UserAvatarRead}`);
    ava.is(result.callbacks_url, "https://flat.io");
    ava.is(result.app_desc, newConfig.appDesc);
    ava.is(result.app_name, newConfig.appName);
    ava.is(result.homepage_url, newConfig.homepageURL);

    await releaseRunner();
});

test(`${namespace} - update - no update data`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID, appName } = await createOAuthInfos.quick();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, ownerUUID);
    await DeveloperOAuthInfoSVC.update({
        oauthUUID,
    });

    const result = (await oauthInfosDAO.findOne(t, ["app_name"], {
        oauth_uuid: oauthUUID,
    }))!;

    ava.is(result.app_name, appName);
    await releaseRunner();
});

test(`${namespace} - info`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const createData = await createOAuthInfos.quick();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, createData.ownerUUID);
    const info = await DeveloperOAuthInfoSVC.info(createData.oauthUUID);

    // @ts-ignore
    delete createData.oauthUUID;
    // @ts-ignore
    delete createData.ownerUUID;

    ava.deepEqual(createData, info);
    ava.is(Schema.check(developerOAuthInfoInfoReturnSchema, info), null);

    await releaseRunner();
});

test(`${namespace} - info - not found`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, v4());

    await ava.throwsAsync(() => DeveloperOAuthInfoSVC.info(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.OAuthUUIDNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - detail`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createUser, createOAuthUsers } = testService(t);

    const { userUUID, userName } = await createUser.quick();

    const createData = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });

    await createOAuthUsers.quick({
        userUUID,
        oauthUUID: createData.oauthUUID,
    });

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, createData.ownerUUID);
    const info = await DeveloperOAuthInfoSVC.detail(createData.oauthUUID);

    ava.deepEqual(info, {
        ownerName: userName,
        appName: createData.appName,
        appDesc: createData.appDesc,
        homepageURL: createData.homepageURL,
        logoURL: createData.logoURL,
        scopes: createData.scopes,
    });

    await releaseRunner();
});

test(`${namespace} - detail - not found`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, v4());

    await ava.throwsAsync(() => DeveloperOAuthInfoSVC.detail(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.OAuthUUIDNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - findClientID`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { clientID, oauthUUID } = await createOAuthInfos.quick();

    const DeveloperOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, v4());

    ava.is(await DeveloperOAuthInfoSVC.findClientID(oauthUUID), clientID);

    await ava.throwsAsync(() => DeveloperOAuthInfoSVC.findClientID(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.OAuthClientIDNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - assertIsOwner`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { ownerUUID, oauthUUID } = await createOAuthInfos.quick();

    const developerOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, ownerUUID);

    {
        await developerOAuthInfoSVC.assertIsOwner(oauthUUID);
        ava.pass();
    }

    await ava.throwsAsync(() => developerOAuthInfoSVC.assertIsOwner(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.OAuthUUIDNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - getLogoURL`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();

    const developerOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, v4());

    {
        const logoURL = await developerOAuthInfoSVC.getLogoURL(oauthUUID);

        ava.true(logoURL.length > 2);
    }

    {
        await ava.throwsAsync(() => developerOAuthInfoSVC.getLogoURL(v4()), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.OAuthUUIDNotFound}`,
        });
    }

    await releaseRunner();
});

test(`${namespace} - updateLogoURL`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();

    const developerOAuthInfoSVC = new DeveloperOAuthInfoService(ids(), t, v4());

    const logoURL = `https://${v4()}.com/1.png`;

    await developerOAuthInfoSVC.updateLogoURL(oauthUUID, logoURL);

    const result = await oauthInfosDAO.findOne(t, ["logo_url"], {
        oauth_uuid: oauthUUID,
    });

    ava.is(result?.logo_url, logoURL);

    await releaseRunner();
});
