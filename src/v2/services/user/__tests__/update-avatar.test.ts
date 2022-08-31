import test from "ava";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { SinonStub, stub } from "sinon";
import * as sl from "../../../service-locator";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { UserUploadAvatarService } from "../upload-avatar";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { testService } from "../../../__tests__/helpers/db";
import { userDAO } from "../../../dao";
import { CloudStorageUploadService } from "../../cloud-storage/upload";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "v2.services.user.update-avatar";
initializeDataSource(test, namespace);

let useOnceService: SinonStub;
test.beforeEach(() => {
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        policyTemplate: () => ({ policy: "x", signature: "y" }),
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
    const [fileName, fileSize] = [`${v4()}.png`, 12];

    const result = await new UserUploadAvatarService(ids(), t, v4()).start({
        fileName,
        fileSize,
    });

    ava.true(result.ossFilePath.endsWith(".png"));

    await releaseRunner();
});

test.serial(`${namespace} - finish`, async ava => {
    const { t, commitTransaction, startTransaction, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);
    const { userUUID } = await createUser.full({
        userUUID: v4(),
        avatarURL: "https://a.cn/avatar.png",
        userPassword: "",
        userName: v4(),
    });
    const [fileUUID, fileName] = [v4(), `${v4()}.png`];

    await RedisService.hmset(
        RedisKey.userAvatarFileInfo(userUUID, fileUUID),
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

    await new UserUploadAvatarService(ids(), t, userUUID).finish(fileUUID);

    await commitTransaction();
    await startTransaction();

    const result = await userDAO.findOne(t, "avatar_url", {
        user_uuid: userUUID,
    });

    ava.is(
        result.avatar_url,
        `https://a.cn/${CloudStorageUploadService.generateOSSFilePath(fileName, fileUUID)}`,
    );

    redisDel.restore();
    await releaseRunner();
});

test.serial(`${namespace} - get file info by redis is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUploadAvatarSVC = new UserUploadAvatarService(ids(), t, v4());

    await ava.throwsAsync(() => userUploadAvatarSVC.getFileInfoByRedis(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });

    await releaseRunner();
});
