import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { DeveloperOAuthSecretService } from "../oauth-secret";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { oauthSecretsDAO } from "../../../../dao";
import { FError } from "../../../../../error/ControllerError";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";

const namespace = "v2.services.developer.oauth.oauth-secret";
initializeDataSource(test, namespace);

test(`${namespace} - create`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, clientID } = await createOAuthInfos.quick();

    const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, v4());
    const { clientSecret } = await oauthSecretSVC.create(oauthUUID);

    const result = await oauthSecretsDAO.findOne(t, ["id"], {
        client_id: clientID,
        client_secret: clientSecret,
    });

    ava.truthy(result);

    await releaseRunner();
});

test(`${namespace} - info`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createSecretsInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();
    const secret = await createSecretsInfos.quick({
        oauthUUID,
    });
    const secret2 = await createSecretsInfos.quick({
        oauthUUID,
    });

    const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, v4());
    const clientSecret = await oauthSecretSVC.info(oauthUUID);

    ava.is(clientSecret[0].clientSecret, `******${secret2.clientSecret.slice(-8)}`);
    ava.is(clientSecret[0].secretUUID, secret2.secretUUID);
    ava.is(clientSecret[1].clientSecret, `******${secret.clientSecret.slice(-8)}`);
    ava.is(clientSecret[1].secretUUID, secret.secretUUID);

    await releaseRunner();
});

test(`${namespace} - delete`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createSecretsInfos } = testService(t);

    const oauthUUID = v4();
    const { secretUUID } = await createSecretsInfos.quick({
        oauthUUID,
    });

    const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, v4());
    await oauthSecretSVC.delete(secretUUID);

    ava.is((await oauthSecretSVC.info(oauthUUID)).length, 0);

    await releaseRunner();
});

test(`${namespace} - deleteAll`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createSecretsInfos } = testService(t);

    const oauthUUID = v4();
    await Promise.all([
        createSecretsInfos.quick({
            oauthUUID,
        }),
        createSecretsInfos.quick({
            oauthUUID,
        }),
    ]);

    const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, v4());
    await oauthSecretSVC.deleteAll(oauthUUID);

    ava.is((await oauthSecretSVC.info(oauthUUID)).length, 0);

    await releaseRunner();
});

test(`${namespace} - assertIsOwner`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createSecretsInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();
    const { secretUUID } = await createSecretsInfos.quick({
        oauthUUID,
    });

    {
        const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, ownerUUID);
        await oauthSecretSVC.assertIsOwner(secretUUID);
        ava.pass();
    }

    {
        const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, v4());
        await ava.throwsAsync(() => oauthSecretSVC.assertIsOwner(secretUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.OAuthUUIDNotFound}`,
        });
    }

    {
        const oauthSecretSVC = new DeveloperOAuthSecretService(ids(), t, ownerUUID);
        await ava.throwsAsync(() => oauthSecretSVC.assertIsOwner(v4()), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.OAuthSecretUUIDNotFound}`,
        });
    }

    await releaseRunner();
});
