import test from "ava";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageInfoService } from "../info";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";
import {
    findFilesInfoSchema,
    listFilesAndTotalUsageByUserUUIDSchema,
    listSchema,
} from "../info.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { v4 } from "uuid";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";

const namespace = "services.cloud-storage.info";

initializeDataSource(test, namespace);

test(`${namespace} - totalUsage`, async ava => {
    const { t } = await useTransaction();

    const { userUUID, totalUsage } = await CreateCloudStorageConfigs.quick();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const totalUsageBySVC = await cloudStorageInfoSVC.totalUsage();

    ava.is(totalUsage, totalUsageBySVC);
});

test(`${namespace} - totalUsage - empty`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const totalUsage = await cloudStorageInfoSVC.totalUsage();

    ava.is(totalUsage, 0);
});

test(`${namespace} - list`, async ava => {
    const { t } = await useTransaction();

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const [f1, f2, f3] = [
        await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardConvert),
        await CreateCloudStorageFiles.quick(FileResourceType.NormalResources),
        await CreateCloudStorageFiles.quick(FileResourceType.OnlineCourseware),
    ];
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        f2.fileUUID,
        f3.fileUUID,
    ]);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.list({
        order: "DESC",
        page: 1,
        size: 2,
        directoryPath: "/",
    });

    ava.is(result.length, 2);
    ava.is(result[0].fileUUID, f3.fileUUID);
    ava.is(result[1].fileUUID, f2.fileUUID);

    ava.is(Schema.check(listSchema, result), null);
});

test(`${namespace} - list - dir`, async ava => {
    const { t } = await useTransaction();

    const [directoryPath, directoryName, jpgFileName, mp4FileName] = [
        "/",
        v4(),
        `${v4()}.jpg`,
        `${v4()}.mp4`,
    ];
    const subDirectoryPath = `${directoryPath}${directoryName}/`;

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const [f1, d1, f2, f3] = [
        await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardConvert),
        await CreateCloudStorageFiles.createDirectory(directoryPath, directoryName),
        await CreateCloudStorageFiles.fixedDirectoryPath(subDirectoryPath, jpgFileName),
        await CreateCloudStorageFiles.fixedDirectoryPath(subDirectoryPath, mp4FileName),
    ];

    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        d1.fileUUID,
        f2.fileUUID,
        f3.fileUUID,
    ]);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);

    {
        const result = await cloudStorageInfoSVC.list({
            directoryPath: subDirectoryPath,
            size: 3,
            page: 1,
            order: "DESC",
        });
        ava.is(result.length, 2);
        ava.is(result[0].fileUUID, f3.fileUUID);
        ava.is(result[1].fileUUID, f2.fileUUID);
        ava.is(Schema.check(listSchema, result), null);
    }

    {
        const result = await cloudStorageInfoSVC.list({
            directoryPath,
            size: 3,
            page: 1,
            order: "DESC",
        });

        ava.is(result.length, 2);
        ava.is(result[0].fileUUID, d1.fileUUID);
        ava.is(result[1].fileUUID, f1.fileUUID);
        ava.is(Schema.check(listSchema, result), null);
    }
});

test(`${namespace} - list - empty`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageInfoSVC.list({
        order: "DESC",
        page: 1,
        size: 2,
        directoryPath: "/",
    });

    ava.is(result.length, 0);
    ava.is(Schema.check(listSchema, result), null);
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID`, async ava => {
    const { t } = await useTransaction();

    const { userUUID, totalUsage } = await CreateCloudStorageConfigs.quick();
    const [f1, f2, f3] = [
        await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardConvert),
        await CreateCloudStorageFiles.quick(FileResourceType.NormalResources),
        await CreateCloudStorageFiles.quick(FileResourceType.OnlineCourseware),
    ];
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        f2.fileUUID,
        f3.fileUUID,
    ]);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 5,
        directoryPath: "/",
    });

    ava.is(result.totalUsage, totalUsage);
    ava.is(result.items.length, 3);
    ava.is(result.items[0].fileUUID, f1.fileUUID);
    ava.is(result.items[1].fileUUID, f2.fileUUID);
    ava.is(result.items[2].fileUUID, f3.fileUUID);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID - empty`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageInfoSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 3,
        directoryPath: "/",
    });

    ava.is(result.totalUsage, 0);
    ava.is(result.items.length, 0);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);
});

test(`${namespace} - findFilesInfo - empty data`, async ava => {
    const { t } = await useTransaction();
    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageInfoSVC.findFilesInfo();

    ava.is(Schema.check(findFilesInfoSchema, result), null);
    ava.is(result.length, 0);
});

test(`${namespace} - findFilesInfo - success`, async ava => {
    const { t } = await useTransaction();

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const [f1, f2] = [
        await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardConvert),
        await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardProjector),
    ];
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        f2.fileUUID,
    ]);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.findFilesInfo();

    ava.is(Schema.check(findFilesInfoSchema, result), null);
    ava.is(result.length, 2);
    ava.deepEqual(result[0].fileUUID, f1.fileUUID);
    ava.deepEqual(result[1].fileUUID, f2.fileUUID);
});

test(`${namespace} - findFileInfo - not found`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageInfoSVC.findFileInfo(v4());

    ava.is(result, null);
});

test(`${namespace} - findFileInfo - found file`, async ava => {
    const { t } = await useTransaction();

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const fileInfo = await CreateCloudStorageFiles.quick(FileResourceType.WhiteboardProjector);
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileInfo.fileUUID);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.findFileInfo(fileInfo.fileUUID);

    ava.is(result!.fileName, fileInfo.fileName);
    ava.is(result!.fileUUID, fileInfo.fileUUID);
});
