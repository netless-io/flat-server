import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { DeveloperOAuthService } from "../oauth";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { DeveloperOAuthScope } from "../../../../../model/oauth/oauth-infos";
import { oauthInfosDAO } from "../../../../dao";
import { testService } from "../../../../__tests__/helpers/db";
import { Schema } from "../../../../__tests__/helpers/schema";
import { developerOAuthInfoReturnSchema } from "../oauth.schema";
import { DeveloperOAuthListByUserReturn } from "../oauth.type";

const namespace = "v2.services.developer.oauth";
initializeDataSource(test, namespace);

test(`${namespace} - list`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const userUUID = v4();
    await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });
    const o2 = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });
    const o3 = await createOAuthInfos.quick({
        ownerUUID: userUUID,
    });

    const developerOAuthSVC = new DeveloperOAuthService(ids(), t, userUUID);
    const result = await developerOAuthSVC.list({
        page: 1,
        size: 2,
    });

    ava.deepEqual(result, [
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
    ]);

    await releaseRunner();
});

test(`${namespace} - create`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [userUUID, appName, appDesc, scopes, homepageURL, callbacksURL] = [
        v4(),
        v4().slice(20),
        v4(),
        [DeveloperOAuthScope.UserNameRead],
        `https://${v4()}.com`,
        [`https://${v4()}.com`],
    ];

    const developerOAuthSVC = new DeveloperOAuthService(ids(), t, userUUID);
    const oauthUUID = await developerOAuthSVC.create({
        appName,
        appDesc,
        scopes,
        callbacksURL,
        homepageURL,
    });

    const result = (await oauthInfosDAO.findOne(
        t,
        ["app_name", "app_desc", "scopes", "homepage_url", "callbacks_url"],
        {
            oauth_uuid: oauthUUID,
        },
    ))!;

    ava.is(result.app_name, appName);
    ava.is(result.app_desc, appDesc);
    ava.is(result.scopes, scopes.join(" "));
    ava.is(result.homepage_url, homepageURL);
    ava.is(result.callbacks_url, callbacksURL.join(" "));

    await releaseRunner();
});

test(`${namespace} - info`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createOAuthUsers, createSecretsInfos } = testService(t);

    const { oauthUUID, appName, appDesc, scopes, homepageURL, callbacksURL, logoURL } =
        await createOAuthInfos.quick();
    await Promise.all([
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createSecretsInfos.quick({
            oauthUUID,
        }),
        createSecretsInfos.quick({
            oauthUUID,
        }),
    ]);

    const developerOAuthSVC = new DeveloperOAuthService(ids(), t, v4());
    const result = await developerOAuthSVC.info(oauthUUID);

    ava.is(result.appName, appName);
    ava.is(result.appDesc, appDesc);
    ava.deepEqual(result.scopes, scopes);
    ava.is(result.homepageURL, homepageURL);
    ava.deepEqual(result.callbacksURL, callbacksURL);
    ava.is(result.logoURL, logoURL);
    ava.is(result.secrets.length, 2);
    ava.is(result.userCount, 2);

    ava.is(Schema.check(developerOAuthInfoReturnSchema, result), null);

    await releaseRunner();
});

test(`${namespace} - listByUser`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createOAuthUsers, createUser } = testService(t);

    const userUUID = v4();
    const [oauthInfo1, oauthInfo2, oauthInfo3] = await Promise.all([
        createOAuthInfos.quick(),
        createOAuthInfos.quick(),
        createOAuthInfos.quick(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, user2, user3] = await Promise.all([
        createUser.fixedUUID(oauthInfo1.ownerUUID),
        createUser.fixedUUID(oauthInfo2.ownerUUID),
        createUser.fixedUUID(oauthInfo3.ownerUUID),
    ]);

    await Promise.all([
        createOAuthUsers.quick({
            oauthUUID: oauthInfo1.oauthUUID,
            userUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID: oauthInfo2.oauthUUID,
            userUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID: oauthInfo3.oauthUUID,
            userUUID,
        }),
    ]);

    const developerOAuthSVC = new DeveloperOAuthService(ids(), t, userUUID);
    const result = await developerOAuthSVC.listByUser({
        page: 1,
        size: 2,
    });

    ava.deepEqual(
        result.sort(sortByOauthUUID),
        [
            {
                ownerName: user3.userName,
                oauthUUID: oauthInfo3.oauthUUID,
                appName: oauthInfo3.appName,
                homepageURL: oauthInfo3.homepageURL,
                logoURL: oauthInfo3.logoURL,
            },
            {
                ownerName: user2.userName,
                oauthUUID: oauthInfo2.oauthUUID,
                appName: oauthInfo2.appName,
                homepageURL: oauthInfo2.homepageURL,
                logoURL: oauthInfo2.logoURL,
            },
        ].sort(sortByOauthUUID),
    );

    type Item = DeveloperOAuthListByUserReturn[number];
    function sortByOauthUUID(a: Item, b: Item) {
        return a.oauthUUID.localeCompare(b.oauthUUID);
    }

    await releaseRunner();
});
