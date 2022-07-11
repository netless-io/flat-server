import test from "ava";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageInfoService } from "../info";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";
import { listFilesAndTotalUsageByUserUUIDSchema, listSchema } from "../info.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { v4 } from "uuid";

const namespace = "services.cloud-storage.info";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - totalUsage`, async ava => {
    const { userUUID, totalUsage } = await CreateCloudStorageConfigs.quick();

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), userUUID);
    const totalUsageBySVC = await cloudStorageConfigsSVC.totalUsage();

    ava.is(totalUsage, totalUsageBySVC);
});

test(`${namespace} - totalUsage - empty`, async ava => {
    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), v4());
    const totalUsage = await cloudStorageConfigsSVC.totalUsage();

    ava.is(totalUsage, 0);
});

test(`${namespace} - list`, async ava => {
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), userUUID);
    const result = await cloudStorageConfigsSVC.list({
        order: "DESC",
        page: 1,
        size: 2,
    });

    ava.is(result.length, 2);
    ava.is(result[0].fileUUID, f3.fileUUID);
    ava.is(result[1].fileUUID, f2.fileUUID);

    ava.is(Schema.check(listSchema, result), null);
});

test(`${namespace} - list - empty`, async ava => {
    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), v4());
    const result = await cloudStorageConfigsSVC.list({
        order: "DESC",
        page: 1,
        size: 2,
    });

    ava.is(result.length, 0);
    ava.is(Schema.check(listSchema, result), null);
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID`, async ava => {
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), userUUID);
    const result = await cloudStorageConfigsSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 5,
    });

    ava.is(result.totalUsage, totalUsage);
    ava.is(result.files.length, 3);
    ava.is(result.files[0].fileUUID, f1.fileUUID);
    ava.is(result.files[1].fileUUID, f2.fileUUID);
    ava.is(result.files[2].fileUUID, f3.fileUUID);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID - empty`, async ava => {
    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), v4());
    const result = await cloudStorageConfigsSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 3,
    });

    ava.is(result.totalUsage, 0);
    ava.is(result.files.length, 0);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);
});
