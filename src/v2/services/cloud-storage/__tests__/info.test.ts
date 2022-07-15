import test from "ava";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageInfoService } from "../info";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";
import {
    existsDirectorySchema,
    listFilesAndTotalUsageByUserUUIDSchema,
    listSchema,
} from "../info.schema";
import { Schema } from "../../../__tests__/helpers/schema";
import { v4 } from "uuid";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../dao";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { Status } from "../../../../constants/Project";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";

const namespace = "services.cloud-storage.info";

initializeDataSource(test, namespace);

test(`${namespace} - totalUsage`, async ava => {
    const { t } = await useTransaction();

    const { userUUID, totalUsage } = await CreateCloudStorageConfigs.quick();

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const totalUsageBySVC = await cloudStorageConfigsSVC.totalUsage();

    ava.is(totalUsage, totalUsageBySVC);
});

test(`${namespace} - totalUsage - empty`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, v4());
    const totalUsage = await cloudStorageConfigsSVC.totalUsage();

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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageConfigsSVC.list({
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);

    {
        const result = await cloudStorageConfigsSVC.list({
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
        const result = await cloudStorageConfigsSVC.list({
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageConfigsSVC.list({
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const result = await cloudStorageConfigsSVC.listFilesAndTotalUsageByUserUUID({
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

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, v4());
    const result = await cloudStorageConfigsSVC.listFilesAndTotalUsageByUserUUID({
        order: "ASC",
        page: 1,
        size: 3,
        directoryPath: "/",
    });

    ava.is(result.totalUsage, 0);
    ava.is(result.items.length, 0);

    ava.is(Schema.check(listFilesAndTotalUsageByUserUUIDSchema, result), null);
});

test(`${namespace} - existsDirectory - should return true`, async ava => {
    const { t } = await useTransaction();

    const [userUUID, directoryPath, directoryName] = [v4(), `/${v4()}/`, v4()];
    const fullDirectoryPath = `${directoryPath}${directoryName}/`;
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory(
        directoryPath,
        directoryName,
    );
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);

    const result = await cloudStorageConfigsSVC.existsDirectory(fullDirectoryPath);
    ava.is(result, true);
    ava.is(Schema.check(existsDirectorySchema, result), null);
});

test(`${namespace} - existsDirectory - should return true when directory is /`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);

    ava.is(await cloudStorageConfigsSVC.existsDirectory("/"), true);
});

test(`${namespace} - existsDirectory - should return false`, async ava => {
    const { t } = await useTransaction();

    const [userUUID, directoryPath, directoryName] = [v4(), `/${v4()}/`, v4()];
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory(
        directoryPath,
        directoryName,
    );
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);

    ava.is(await cloudStorageConfigsSVC.existsDirectory(`/${v4()}/`), false);
});

test(`${namespace} - createDirectory - create nested success`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const parentDirectoryName = v4();
    const parentDirectoryPath = `/${parentDirectoryName}/`;
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory("/", parentDirectoryName);
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const directoryName = v4();
    await cloudStorageConfigsSVC.createDirectory(parentDirectoryPath, directoryName);

    {
        const result = await cloudStorageUserFilesDAO.findOne(t, "id", {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });
        ava.is(!!result, true);
    }

    {
        const fullDirectoryPath = `${parentDirectoryPath}${directoryName}/`;
        const result = await cloudStorageFilesDAO.findOne(t, "id", {
            file_uuid: fileUUID,
            file_name: `${fullDirectoryPath}.keep`,
            directory_path: parentDirectoryPath,
            resource_type: FileResourceType.Directory,
            file_url: `file://${fullDirectoryPath}.keep`,
            file_size: 0,
        });
        ava.is(!!result, true);
    }
});

test(`${namespace} - createDirectory - directory is tool long`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const directoryName = new Array(300).fill("a").join("");

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);

    await ava.throwsAsync(cloudStorageConfigsSVC.createDirectory("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - createDirectory - parent directory does not exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const parentDirectory = `/${v4()}/`;

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const directoryName = v4();
    await ava.throwsAsync(cloudStorageConfigsSVC.createDirectory(parentDirectory, directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParentDirectoryNotExists}`,
    });
});

test(`${namespace} - createDirectory - directory already exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const directoryName = v4();

    const cloudStorageConfigsSVC = new CloudStorageInfoService(v4(), t, userUUID);
    await cloudStorageConfigsSVC.createDirectory("/", directoryName);

    await ava.throwsAsync(cloudStorageConfigsSVC.createDirectory("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });
});
