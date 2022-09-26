import test from "ava";
import { SinonStub, stub } from "sinon";
import { v4 } from "uuid";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { DeveloperOAuthLogoService } from "../oauth-logo";
import { testService } from "../../../../__tests__/helpers/db";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { oauthInfosDAO } from "../../../../dao";
import { FError } from "../../../../../error/ControllerError";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import * as sl from "../../../../service-locator";
import { OAuth } from "../../../../../constants/Config";
import path from "path";

const namespace = "v2.services.developer.oauth.logo";
initializeDataSource(test, namespace);

let useOnceService: SinonStub;
test.beforeEach(() => {
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        policyTemplate: () => ({ policy: "x", signature: "z" }),
        domain: "https://a.cn",
        assertExists: () => Promise.resolve(void 0),
        remove: () => Promise.resolve(void 0),
        assertImageNormal: () => Promise.resolve(void 0),
    });
});
test.afterEach(() => {
    useOnceService.restore();
});

test.serial(`${namespace} - start`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID } = await createOAuthInfos.quick();
    const [fileName, fileSize] = [`${v4()}.png`, 12];

    const result = await new DeveloperOAuthLogoService(ids(), t, v4()).start({
        oauthUUID,
        fileName,
        fileSize,
    });

    ava.true(result.ossFilePath.endsWith(".png"));

    await releaseRunner();
});

test.serial(`${namespace} - finish`, async ava => {
    const { t, commitTransaction, startTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos } = testService(t);

    const { oauthUUID, ownerUUID } = await createOAuthInfos.quick();
    const [fileUUID, fileName] = [v4(), `${v4()}.png`];

    await RedisService.hmset(
        RedisKey.oauthLogoFileInfo(oauthUUID, fileUUID),
        {
            fileName,
        },
        20,
    );

    useOnceService.returns({
        domain: "https://a.cn",
        remove: () => Promise.reject(new Error("remove error")),
        assertExists: () => Promise.resolve(void 0),
        assertImageNormal: () => Promise.resolve(void 0),
    });

    const redisDel = stub(RedisService, "del").rejects(new Error("xx"));

    await new DeveloperOAuthLogoService(ids(), t, ownerUUID).finish({
        fileUUID,
        oauthUUID,
    });

    await commitTransaction();
    await startTransaction();

    const result = await oauthInfosDAO.findOne(t, "logo_url", {
        oauth_uuid: oauthUUID,
    });

    ava.is(
        result.logo_url,
        `https://a.cn/${DeveloperOAuthLogoService.generateOSSFilePath(
            fileName,
            oauthUUID,
            fileUUID,
        )}`,
    );

    redisDel.restore();
    await releaseRunner();
});

test.serial(`${namespace} - get file info by redis is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUploadAvatarSVC = new DeveloperOAuthLogoService(ids(), t, v4());

    await ava.throwsAsync(() => userUploadAvatarSVC.getFileInfoByRedis(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });

    await releaseRunner();
});

test.serial(`${namespace} - generateOSSFilePath`, ava => {
    const [fileUUID, oauthUUID, fileName] = [v4(), v4(), "1.png"];

    const result = DeveloperOAuthLogoService.generateOSSFilePath(fileName, oauthUUID, fileUUID);

    ava.is(result, `${OAuth.logo.prefixPath}/${oauthUUID}/${fileUUID}${path.extname(fileName)}`);
});
