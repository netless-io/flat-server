import test from "ava";
import { CloudStorageUploadService } from "../upload";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import { CloudStorage, Whiteboard } from "../../../../constants/Config";
import { v4 } from "uuid";
import path from "path";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { SinonStub, stub } from "sinon";
import * as sl from "../../../service-locator";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import {
    cloudStorageConfigsDAO,
    cloudStorageFilesDAO,
    cloudStorageUserFilesDAO,
} from "../../../dao";
import { GetFileInfoByRedisReturnSchema, uploadStartReturnSchema } from "../upload.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";

const namespace = "v2.services.cloud-storage.upload";
initializeDataSource(test, namespace);

let useOnceService: SinonStub;
test.beforeEach(() => {
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        domain: "x",
        policyTemplate: () => ({ policy: "x", signature: "y" }),
        assertExists: () => Promise.resolve(void 0),
    });
});
test.afterEach(() => {
    useOnceService.restore();
});

test.serial(`${namespace} - generateFilePayload - NormalResources`, ava => {
    const payload = CloudStorageUploadService.generateFilePayload(FileResourceType.NormalResources);

    ava.deepEqual(payload, {});
});

test.serial(`${namespace} - generateFilePayload - WhiteboardProjector`, ava => {
    const payload = CloudStorageUploadService.generateFilePayload(
        FileResourceType.WhiteboardProjector,
    );

    ava.deepEqual(payload, {
        region: Whiteboard.convertRegion,
        convertStep: FileConvertStep.None,
    });
});

test.serial(`${namespace} - generateOSSFilePath`, ava => {
    const [fileName, fileUUID] = [`${v4()}.png`, v4()];
    const result = CloudStorageUploadService.generateOSSFilePath(fileName, fileUUID);

    ava.true(result.endsWith(`${fileUUID}/${fileUUID}${path.extname(fileName)}`));
});

test.serial(`${namespace} - getFileInfoByRedis`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [userUUID, fileUUID, fileName, fileSize, targetDirectoryPath, fileResourceType] = [
        v4(),
        v4(),
        `${v4()}.png`,
        20,
        "/",
        FileResourceType.NormalResources,
    ];

    await RedisService.hmset(
        RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
        {
            fileName,
            fileSize: String(fileSize),
            targetDirectoryPath,
            fileResourceType,
        },
        20,
    );

    const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
    const result = await cloudStorageUploadSVC.getFileInfoByRedis(fileUUID);

    ava.is(Schema.check(GetFileInfoByRedisReturnSchema, result), null);

    ava.deepEqual(result, {
        fileName,
        fileSize,
        targetDirectoryPath,
        fileResourceType,
    });

    await releaseRunner();
});

test.serial(`${namespace} - getFileInfoByRedis - result is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [userUUID, fileName, fileSize, directoryPath, fileResourceType] = [
        v4(),
        `${v4()}.png`,
        20,
        "/",
        FileResourceType.NormalResources,
    ];

    {
        const fileUUID = v4();
        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileSize: String(fileSize),
                directoryPath,
                fileResourceType,
            },
            20,
        );

        const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
        await ava.throwsAsync(() => cloudStorageUploadSVC.getFileInfoByRedis(fileUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
        });
    }
    {
        const fileUUID = v4();
        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName,
                directoryPath,
                fileResourceType,
            },
            20,
        );

        const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
        await ava.throwsAsync(() => cloudStorageUploadSVC.getFileInfoByRedis(fileUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
        });
    }
    {
        const fileUUID = v4();
        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName: v4(),
                fileSize: String(fileSize),
                fileResourceType,
            },
            20,
        );

        const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
        await ava.throwsAsync(() => cloudStorageUploadSVC.getFileInfoByRedis(fileUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
        });
    }
    {
        const fileUUID = v4();
        await RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            {
                fileName: v4(),
                fileSize: String(fileSize),
                directoryPath,
            },
            20,
        );

        const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
        await ava.throwsAsync(() => cloudStorageUploadSVC.getFileInfoByRedis(fileUUID), {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
        });
    }

    await releaseRunner();
});

test.serial(`${namespace} - assertConcurrentFileSize`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const userUUID = v4();

    await Promise.all([
        RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, v4()),
            {
                foo: "bar",
            },
            20,
        ),
        RedisService.hmset(
            RedisKey.cloudStorageFileInfo(userUUID, v4()),
            {
                fileSize: String(CloudStorage.totalSize),
            },
            20,
        ),
    ]);

    const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);

    await ava.throwsAsync(() => cloudStorageUploadSVC.assertConcurrentFileSize(10), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.NotEnoughTotalUsage}`,
    });

    await releaseRunner();
});

test.serial(`${namespace} - getTotalUsageByUpdated - NotEnoughTotalUsage`, async ava => {
    const { t, commitTransaction, startTransaction, releaseRunner } = await useTransaction();
    const userUUID = v4();

    await commitTransaction();
    await startTransaction();

    const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
    await ava.throwsAsync(
        () => cloudStorageUploadSVC.getTotalUsageByUpdated(CloudStorage.totalSize + 20),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.NotEnoughTotalUsage}`,
        },
    );

    await releaseRunner();
});

test.serial(`${namespace} - getTotalUsageByUpdated - success`, async ava => {
    const { t, commitTransaction, startTransaction, releaseRunner } = await useTransaction();
    const userUUID = v4();

    await cloudStorageConfigsDAO.insert(t, {
        user_uuid: userUUID,
        total_usage: String(CloudStorage.totalSize - 20),
    });
    await commitTransaction();
    await startTransaction();

    const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
    await cloudStorageUploadSVC.getTotalUsageByUpdated(20);
    ava.pass();

    await releaseRunner();
});

test.serial(`${namespace} - assertConcurrentLimit`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const userUUID = v4();

    const fileUUIDs = Array.from({ length: CloudStorage.concurrent }, () => v4());

    await Promise.all(
        fileUUIDs.map(fileUUID => {
            return RedisService.hmset(
                RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
                {
                    fileSize: "10",
                },
                20,
            );
        }),
    );

    const cloudStorageUploadSVC = new CloudStorageUploadService(ids(), t, userUUID);
    await ava.throwsAsync(() => cloudStorageUploadSVC.assertConcurrentLimit(), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.UploadConcurrentLimit}`,
    });

    await releaseRunner();
});

test.serial(`${namespace} - updateTotalUsage`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const userUUID = v4();

    await new CloudStorageUploadService(ids(), t, userUUID).updateTotalUsage(20);

    const { total_usage } = await cloudStorageConfigsDAO.findOne(t, "total_usage", {
        user_uuid: userUUID,
    });
    ava.is(total_usage, String(20));

    await releaseRunner();
});

test.serial(`${namespace} - insertFile`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const userUUID = v4();

    const [fileUUID, fileName, directoryPath, fileResourceType, fileSize, fileURL] = [
        v4(),
        `${v4()}.mp4`,
        "/",
        FileResourceType.WhiteboardProjector,
        20,
        `https://${v4()}`,
    ];

    await new CloudStorageUploadService(ids(), t, userUUID).insertFile({
        fileUUID,
        fileName,
        directoryPath,
        fileResourceType,
        fileSize,
        fileURL,
    });

    {
        const { file_uuid } = await cloudStorageUserFilesDAO.findOne(t, "file_uuid", {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });
        ava.is(file_uuid, fileUUID);
    }
    {
        const { directory_path } = await cloudStorageFilesDAO.findOne(t, "directory_path", {
            file_name: fileName,
            file_uuid: fileUUID,
        });
        ava.is(directory_path, directoryPath);
    }

    await releaseRunner();
});

test.serial(`${namespace} - finish`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const [fileUUID, fileName, fileSize, fileResourceType] = [
        v4(),
        `${v4()}.png`,
        20,
        FileResourceType.NormalResources,
    ];

    const { userUUID } = await new CreateCloudStorageConfigs(t).fixedTotalUsage(0);
    const dirInfo = await new CreateCloudStorageFiles(t).createDirectory("/", v4());
    await new CreateCloudStorageUserFiles(t).fixedUserUUIDAndFileUUID(userUUID, dirInfo.fileUUID);

    const targetDirectoryPath = `${dirInfo.directoryPath}${dirInfo.fileName}/`;

    await RedisService.hmset(
        RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
        {
            fileName,
            fileSize: String(fileSize),
            targetDirectoryPath,
            fileResourceType,
        },
        20,
    );

    await new CloudStorageUploadService(ids(), t, userUUID).finish({
        fileUUID,
    });

    {
        const { total_usage } = await cloudStorageConfigsDAO.findOne(t, "total_usage", {
            user_uuid: userUUID,
        });
        ava.is(total_usage, String(fileSize));
    }
    {
        const { file_uuid } = await cloudStorageUserFilesDAO.findOne(t, "file_uuid", {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });
        ava.is(file_uuid, fileUUID);
    }
    {
        const { directory_path } = await cloudStorageFilesDAO.findOne(t, "directory_path", {
            file_name: fileName,
            file_uuid: fileUUID,
        });
        ava.is(directory_path, targetDirectoryPath);
    }

    const redisValue = await RedisService.get(RedisKey.cloudStorageFileInfo(userUUID, fileUUID));
    ava.is(redisValue, null);

    await releaseRunner();
});

test.serial(`${namespace} - start use projector`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [userUUID, fileName, targetDirectoryPath, fileSize, convertType] = [
        v4(),
        `${v4()}.ppt`,
        "/",
        20,
        FileResourceType.WhiteboardProjector,
    ];

    const result = await new CloudStorageUploadService(ids(), t, userUUID).start({
        targetDirectoryPath,
        fileName,
        fileSize,
        convertType,
    });

    ava.is(Schema.check(uploadStartReturnSchema, result), null);

    const resourceType = await RedisService.hmget(
        RedisKey.cloudStorageFileInfo(userUUID, result.fileUUID),
        "fileResourceType",
    );
    ava.is(resourceType, FileResourceType.WhiteboardConvert);

    await releaseRunner();
});

test.serial(`${namespace} - start allowWhiteboardConvert`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const [userUUID, fileName, targetDirectoryPath, fileSize, convertType] = [
        v4(),
        `${v4()}.ppt`,
        "/",
        20,
        undefined,
    ];

    const result = await new CloudStorageUploadService(ids(), t, userUUID).start({
        targetDirectoryPath,
        fileName,
        fileSize,
        convertType,
    });

    ava.is(Schema.check(uploadStartReturnSchema, result), null);

    const resourceType = await RedisService.hmget(
        RedisKey.cloudStorageFileInfo(userUUID, result.fileUUID),
        "fileResourceType",
    );
    ava.is(resourceType, FileResourceType.WhiteboardProjector);

    await releaseRunner();
});
