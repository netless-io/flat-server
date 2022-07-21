import test from "ava";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageInfoService } from "../info";
import { listFilesAndTotalUsageByUserUUIDSchema, listSchema } from "../info.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { v4 } from "uuid";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CreateCS } from "../../../__tests__/helpers/db/create-cs-files";

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

    const userUUID = v4();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_f1, f2, f3] = await CreateCS.createFiles(userUUID, "/", 3);

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

    const userUUID = v4();
    const d1 = await CreateCS.createDirectory(userUUID);
    const f1 = await CreateCS.createFile(userUUID);
    const [f2, f3] = await CreateCS.createFiles(userUUID, d1.directoryPath, 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);

    {
        const result = await cloudStorageInfoSVC.list({
            directoryPath: d1.directoryPath,
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
            directoryPath: "/",
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

    const userUUID = v4();
    const { totalUsage } = await CreateCloudStorageConfigs.fixedUserUUID(userUUID);
    const [f1, f2, f3] = await CreateCS.createFiles(userUUID, "/", 3);

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

    ava.is(result.size, 0);
});

test(`${namespace} - findFilesInfo - success`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const [f1, f2] = await CreateCS.createFiles(userUUID, "/", 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.findFilesInfo();

    ava.is(result.size, 2);
    const fileUUIs = [f1.fileUUID, f2.fileUUID];
    result.forEach((_item, fileUUID) => {
        if (!fileUUIs.includes(fileUUID)) {
            ava.fail();
        }
    });
});

test(`${namespace} - findFileInfo - not found`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageInfoSVC.findFileInfo(v4());

    ava.is(result, null);
});

test(`${namespace} - findFileInfo - found file`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const f1 = await CreateCS.createFile(userUUID);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageInfoSVC.findFileInfo(f1.fileUUID);

    ava.is(result!.fileName, f1.fileName);
    ava.is(result!.fileUUID, f1.fileUUID);
});
