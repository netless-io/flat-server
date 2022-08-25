import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { v4 } from "uuid";
import { Schema } from "../../../__tests__/helpers/schema";
import { existsDirectorySchema } from "../directory.schema";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../dao";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageDirectoryService } from "../directory";
import { CloudStorageInfoService } from "../info";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../__tests__/helpers/db";
import ValidationError from "ajv/dist/runtime/validation_error";

const namespace = "services.cloud-storage.directory";

initializeDataSource(test, namespace);

test(`${namespace} - existsDirectory - should return true`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const dir = await createCS.createDirectory(userUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const result = await cloudStorageDirectorySVC.exists(dir.directoryPath);
    ava.is(result, true);
    ava.is(Schema.check(existsDirectorySchema, result), null);

    await releaseRunner();
});

test(`${namespace} - existsDirectory - should return true when directory is /`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUUID = v4();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.exists("/"), true);

    await releaseRunner();
});

test(`${namespace} - existsDirectory - should return false`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    await createCS.createDirectory(userUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.exists(`/${v4()}/`), false);

    await releaseRunner();
});

test(`${namespace} - assert existsDirectory - should throw FError`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUUID = v4();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    await ava.throwsAsync(() => cloudStorageDirectorySVC.assertExists(`/${v4()}/`), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryNotExists}`,
    });

    await releaseRunner();
});

test(`${namespace} - createDirectory - create nested success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const d1 = await createCS.createDirectory(userUUID);
    const d2 = await createCS.createDirectory(userUUID, d1.directoryPath);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);
    const directoryName = v4();
    await cloudStorageDirectorySVC.create(d2.directoryPath, directoryName);

    {
        const result = await cloudStorageUserFilesDAO.findOne(t, ["id"], {
            user_uuid: userUUID,
            file_uuid: d1.fileUUID,
        });
        ava.not(result, null);
    }

    {
        const result = await cloudStorageFilesDAO.findOne(t, ["id"], {
            file_uuid: d2.fileUUID,
            file_name: d2.directoryName,
            directory_path: d1.directoryPath,
            resource_type: FileResourceType.Directory,
            file_size: 0,
        });
        ava.not(result, null);
    }

    await releaseRunner();
});

test(`${namespace} - createDirectory - directory is tool long`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUUID = v4();
    const directoryName = new Array(300).fill("a").join("");

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    await ava.throwsAsync(cloudStorageDirectorySVC.create("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    await releaseRunner();
});

test(`${namespace} - createDirectory - parent directory does not exist`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUUID = v4();
    const parentDirectoryPath = `/${v4()}/`;

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);
    const directoryName = v4();
    await ava.throwsAsync(cloudStorageDirectorySVC.create(parentDirectoryPath, directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryNotExists}`,
    });

    await releaseRunner();
});

test(`${namespace} - createDirectory - directory already exist`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const userUUID = v4();
    const directoryName = v4();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);
    await cloudStorageDirectorySVC.create("/", directoryName);

    await ava.throwsAsync(cloudStorageDirectorySVC.create("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });

    await releaseRunner();
});

test.serial(`${namespace} - rename - params failed`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const filesInfo = new Map();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, v4());

    await ava.throwsAsync(() => cloudStorageDirectorySVC.rename(filesInfo, v4(), "aa/"), {
        instanceOf: ValidationError,
        message: "validation failed",
    });

    await releaseRunner();
});

test(`${namespace} - rename - directory name is same`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const d1 = await createCS.createDirectory(userUUID);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    await cloudStorageDirectorySVC.rename(filesInfo, d1.fileUUID, d1.directoryName);
    ava.pass();

    await releaseRunner();
});

test(`${namespace} - rename - directory is too long - not sub files`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const d1 = await createCS.createDirectory(userUUID, "/", "a".repeat(128));
    const d2 = await createCS.createDirectory(userUUID, d1.directoryPath, "c".repeat(128));
    const d3 = await createCS.createDirectory(userUUID, d2.directoryPath, "d".repeat(40));

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    await ava.throwsAsync(cloudStorageDirectorySVC.rename(filesInfo, d3.fileUUID, "d".repeat(60)), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    await releaseRunner();
});

test(`${namespace} - rename - directory is too long - has sub files`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const d1 = await createCS.createDirectory(userUUID, "/", "a".repeat(100));
    const d2 = await createCS.createDirectory(userUUID, d1.directoryPath, "c".repeat(100));
    const d3 = await createCS.createDirectory(userUUID, d2.directoryPath, "d".repeat(20));
    const d4 = await createCS.createDirectory(userUUID, d3.directoryPath, "e".repeat(50));
    await createCS.createFile(userUUID, d4.directoryPath, "f");

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    await ava.throwsAsync(cloudStorageDirectorySVC.rename(filesInfo, d3.fileUUID, "e".repeat(50)), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    await releaseRunner();
});

test(`${namespace} - rename - directory already exists`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    await ava.throwsAsync(
        cloudStorageDirectorySVC.rename(filesInfo, d1.fileUUID, d2.directoryName),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - rename - success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID, newDirectoryName] = [v4(), v4()];
    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);
    const d3 = await createCS.createDirectory(userUUID, d1.directoryPath);
    const [f1, f2, f3] = await createCS.createFiles(userUUID, d3.directoryPath, 3);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    /**
     * /
     *      d1/
     *          d3/
     *              f1
     *              f2
     *              f3
     *      d2/
     */

    await cloudStorageDirectorySVC.rename(filesInfo, d1.fileUUID, newDirectoryName);

    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: "/",
        });

        ava.is(result.length, 2);
        ava.is(result[0].fileUUID, d2.fileUUID);
        ava.is(result[1].fileUUID, d1.fileUUID);
    }

    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: `/${newDirectoryName}/`,
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileUUID, d3.fileUUID);
    }
    {
        const result = await cloudStorageInfoSVC.list({
            order: "ASC",
            page: 1,
            size: 10,
            directoryPath: `/${newDirectoryName}/${d3.directoryName}/`,
        });

        ava.is(result.length, 3);
        const fileUUIDs = [f1.fileUUID, f2.fileUUID, f3.fileUUID];
        result.forEach(fileInfo => {
            if (!fileUUIDs.includes(fileInfo.fileUUID)) {
                ava.fail();
            }
        });
    }

    await releaseRunner();
});

test(`${namespace} - move - target file already exists`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const d1 = await createCS.createDirectory(userUUID, "/", "a");
    const d2 = await createCS.createDirectory(userUUID, "/", "b");
    await createCS.createDirectory(userUUID, d1.directoryPath, "b");

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();
    await ava.throwsAsync(cloudStorageDirectorySVC.move(filesInfo, d2.fileUUID, d1.directoryPath), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });

    await releaseRunner();
});

test(`${namespace} - move - directory is too long`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    /**
     * d1/ -> 100
     *    d2/ -> 100
     *      d3/ -> 90
     * d4/ -> 1
     *      d5/ -> 36
     *          file -> 1
     */
    const userUUID = v4();
    const directoryName = new Array(100).fill("a").join("");
    const directoryName2 = new Array(90).fill("a").join("");
    const d1 = await createCS.createDirectory(userUUID, "/", directoryName);
    const d2 = await createCS.createDirectory(userUUID, d1.directoryPath, directoryName);
    const d3 = await createCS.createDirectory(userUUID, d2.directoryPath, directoryName2);
    const d4 = await createCS.createDirectory(userUUID, "/", "1");
    const d5 = await createCS.createDirectory(userUUID, d4.directoryPath, v4());
    await createCS.createFile(userUUID, d5.directoryPath, "1");

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    await ava.throwsAsync(cloudStorageDirectorySVC.move(filesInfo, d4.fileUUID, d3.directoryPath), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    await releaseRunner();
});

test(`${namespace} - move - success execute`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);
    const d3 = await createCS.createDirectory(userUUID, d1.directoryPath, v4());
    const [f1, f2, f3] = await createCS.createFiles(userUUID, d3.directoryPath, 3);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(ids(), t, userUUID);

    await cloudStorageDirectorySVC.move(filesInfo, d1.fileUUID, d2.directoryPath);

    const [l1, l2, l3] = await Promise.all([
        cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: "/",
        }),
        cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: d2.directoryPath,
        }),
        cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: `${d2.directoryPath}${d1.directoryName}/${d3.directoryName}/`,
        }),
    ]);

    {
        ava.is(l1.length, 1);
        ava.is(l1[0].fileUUID, d2.fileUUID);
    }
    {
        ava.is(l2.length, 1);
        ava.is(l2[0].fileUUID, d1.fileUUID);
    }
    {
        ava.is(l3.length, 3);
        ava.is(l3[0].fileUUID, f3.fileUUID);
        ava.is(l3[1].fileUUID, f2.fileUUID);
        ava.is(l3[2].fileUUID, f1.fileUUID);
    }

    await releaseRunner();
});
