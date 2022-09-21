import test from "ava";
import { CloudStorageInfoService } from "../info";
import { listFilesAndTotalUsageByUserUUIDSchema, listSchema } from "../info.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { v4 } from "uuid";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../__tests__/helpers/db";
import { FError } from "../../../../error/ControllerError";
import { Region, Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { cloudStorageFilesDAO } from "../../../dao";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";

const namespace = "services.cloud-storage.info";

initializeDataSource(test, namespace);

test(`${namespace} - totalUsage`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageConfigs } = testService(t);

    const { userUUID, totalUsage } = await createCloudStorageConfigs.quick();

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const totalUsageBySVC = await cloudStorageInfoSVC.totalUsage();

    ava.is(totalUsage, totalUsageBySVC);

    await releaseRunner();
});

test(`${namespace} - totalUsage - empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, v4());
    const totalUsage = await cloudStorageInfoSVC.totalUsage();

    ava.is(totalUsage, 0);

    await releaseRunner();
});

test(`${namespace} - list`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_f1, f2, f3] = await createCS.createFiles(userUUID, "/", 3);

    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardProjector,
            file_name: "1.pptx",
            file_size: 20,
            payload: {
                region: Region.GB_LON,
                convertStep: FileConvertStep.Done,
                taskUUID: v4(),
                taskToken: v4(),
            },
        },
        {
            file_uuid: f2.fileUUID,
        },
    );

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
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

    await releaseRunner();
});

test(`${namespace} - list - dir`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const d1 = await createCS.createDirectory(userUUID);
    const f1 = await createCS.createFile(userUUID);
    const [f2, f3] = await createCS.createFiles(userUUID, d1.directoryPath, 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);

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

    await releaseRunner();
});

test(`${namespace} - list - empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, v4());
    const result = await cloudStorageInfoSVC.list({
        order: "DESC",
        page: 1,
        size: 2,
        directoryPath: "/",
    });

    ava.is(result.length, 0);
    ava.is(Schema.check(listSchema, result), null);

    await releaseRunner();
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageConfigs, createCS } = testService(t);

    const userUUID = v4();
    const { totalUsage } = await createCloudStorageConfigs.fixedUserUUID(userUUID);
    const [f1, f2, f3] = await createCS.createFiles(userUUID, "/", 3);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const result = await cloudStorageInfoSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 5,
        directoryPath: "/",
    });

    ava.is(result.totalUsage, totalUsage);
    ava.is(result.files.length, 3);
    ava.is(result.files[0].fileUUID, f1.fileUUID);
    ava.is(result.files[1].fileUUID, f2.fileUUID);
    ava.is(result.files[2].fileUUID, f3.fileUUID);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);

    await releaseRunner();
});

test(`${namespace} - listFilesAndTotalUsageByUserUUID - empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, v4());
    const result = await cloudStorageInfoSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 3,
        directoryPath: "/",
    });

    ava.is(result.totalUsage, 0);
    ava.is(result.files.length, 0);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);

    await releaseRunner();
});

test(`${namespace} - findFilesInfo - empty data`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, v4());
    const result = await cloudStorageInfoSVC.findFilesInfo();

    ava.is(result.size, 0);

    await releaseRunner();
});

test(`${namespace} - findFilesInfo - success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const [f1, f2] = await createCS.createFiles(userUUID, "/", 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const result = await cloudStorageInfoSVC.findFilesInfo();

    ava.is(result.size, 2);
    const fileUUIs = [f1.fileUUID, f2.fileUUID];
    result.forEach((_item, fileUUID) => {
        if (!fileUUIs.includes(fileUUID)) {
            ava.fail();
        }
    });

    await releaseRunner();
});

test(`${namespace} - assert file ownership`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, v4());

    await ava.throwsAsync(() => cloudStorageInfoSVC.assertFileOwnership(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });
    await releaseRunner();
});
