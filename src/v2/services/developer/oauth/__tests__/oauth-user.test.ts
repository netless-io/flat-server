import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { DeveloperOAuthUserService } from "../oauth-user";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { DeveloperOAuthScope } from "../../../../../model/oauth/oauth-infos";

const namespace = "v2.services.developer.oauth.oauth-user";
initializeDataSource(test, namespace);

test(`${namespace} - info`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createOAuthInfos, createOAuthUsers } = testService(t);

    const [userInfo, ownerInfo] = await Promise.all([createUser.quick(), createUser.quick()]);
    const [oauthInfo, oauthInfo2] = await Promise.all([
        createOAuthInfos.quick({
            ownerUUID: ownerInfo.userUUID,
        }),
        createOAuthInfos.quick({
            ownerUUID: ownerInfo.userUUID,
        }),
    ]);
    await createOAuthUsers.quick({
        userUUID: userInfo.userUUID,
        oauthUUID: oauthInfo.oauthUUID,
        scopes: oauthInfo.scopes[0],
    });
    await createOAuthUsers.quick({
        userUUID: userInfo.userUUID,
        oauthUUID: oauthInfo2.oauthUUID,
        scopes: oauthInfo2.scopes[0],
    });

    const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userInfo.userUUID);
    const result = await oauthUserSVC.info({
        page: 1,
        size: 10,
    });

    ava.deepEqual(result, [
        {
            ownerName: ownerInfo.userName,
            oauthUUID: oauthInfo2.oauthUUID,
            appName: oauthInfo2.appName,
            logoURL: oauthInfo2.logoURL,
            homepageURL: oauthInfo2.homepageURL,
        },
        {
            ownerName: ownerInfo.userName,
            oauthUUID: oauthInfo.oauthUUID,
            appName: oauthInfo.appName,
            logoURL: oauthInfo.logoURL,
            homepageURL: oauthInfo.homepageURL,
        },
    ]);

    await releaseRunner();
});

test(`${namespace} - countByOAuthUUID`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthUsers } = testService(t);

    const oauthUUID = v4();

    await Promise.all([
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID,
        }),
    ]);

    const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, v4());
    const result = await oauthUserSVC.countByOAuthUUID(oauthUUID);

    ava.is(result, 2);

    await releaseRunner();
});

test(`${namespace} - countByUserUUID`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthUsers } = testService(t);

    const userUUID = v4();
    await Promise.all([
        createOAuthUsers.quick({
            userUUID,
        }),
        createOAuthUsers.quick({
            userUUID,
        }),
    ]);

    const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userUUID);
    const result = await oauthUserSVC.countByUserUUID();

    ava.is(result, 2);

    await releaseRunner();
});

test(`${namespace} - deleteByOAuthUUID`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthUsers } = testService(t);

    const oauthUUID = v4();

    await Promise.all([
        createOAuthUsers.quick({
            oauthUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID,
        }),
    ]);

    const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, v4());
    await oauthUserSVC.deleteByOAuthUUID(oauthUUID);
    const result = await oauthUserSVC.countByOAuthUUID(oauthUUID);

    ava.is(result, 0);

    await releaseRunner();
});

test(`${namespace} - hasGrant`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthUsers } = testService(t);

    const [oauthUUID, userUUID] = [v4(), v4()];
    await createOAuthUsers.quick({
        userUUID,
        oauthUUID,
    });

    {
        const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userUUID);
        const result = await oauthUserSVC.hasGrant(oauthUUID);
        ava.true(result);
    }

    {
        const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, v4());
        const result = await oauthUserSVC.hasGrant(oauthUUID);
        ava.false(result);
    }

    await releaseRunner();
});

test(`${namespace} - grant`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [oauthUUID, userUUID] = [v4(), v4()];

    {
        const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userUUID);
        await oauthUserSVC.grant({
            oauthUUID,
            scopes: [DeveloperOAuthScope.UserUUIDRead],
        });
        ava.pass();
    }

    {
        // repeat request should be ignored
        const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userUUID);
        await oauthUserSVC.grant({
            oauthUUID,
            scopes: [DeveloperOAuthScope.UserUUIDRead],
        });
        ava.pass();
    }

    await releaseRunner();
});

test(`${namespace} - revoke`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [oauthUUID, userUUID] = [v4(), v4()];

    const oauthUserSVC = new DeveloperOAuthUserService(ids(), t, userUUID);
    await oauthUserSVC.grant({
        oauthUUID,
        scopes: [DeveloperOAuthScope.UserUUIDRead],
    });

    ava.is(await oauthUserSVC.countByUserUUID(), 1);

    await oauthUserSVC.revoke(oauthUUID);

    ava.is(await oauthUserSVC.countByUserUUID(), 0);

    await releaseRunner();
});
