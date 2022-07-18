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
import { CreateCS } from "../../../__tests__/helpers/db/create-cs-files";

const namespace = "services.cloud-storage.directory";

initializeDataSource(test, namespace);

test(`${namespace} - existsDirectory - should return true`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();

    const [dir] = await CreateCS.createDirectory(userUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    const result = await cloudStorageDirectorySVC.exists(dir.directoryPath);
    ava.is(result, true);
    ava.is(Schema.check(existsDirectorySchema, result), null);
});

test(`${namespace} - existsDirectory - should return true when directory is /`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.exists("/"), true);
});

test(`${namespace} - existsDirectory - should return false`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();

    await CreateCS.createDirectory(userUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.exists(`/${v4()}/`), false);
});

test(`${namespace} - createDirectory - create nested success`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();

    const [d1] = await CreateCS.createDirectory(userUUID);
    const [d2] = await CreateCS.createDirectory(userUUID, d1.directoryPath);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    const directoryName = v4();
    await cloudStorageDirectorySVC.create(d2.directoryPath, directoryName);

    {
        const result = await cloudStorageUserFilesDAO.findOne(t, "id", {
            user_uuid: userUUID,
            file_uuid: d1.fileUUID,
        });
        ava.is(!!result, true);
    }

    {
        const result = await cloudStorageFilesDAO.findOne(t, "id", {
            file_uuid: d2.fileUUID,
            file_name: d2.directoryName,
            directory_path: d2.directoryPath,
            resource_type: FileResourceType.Directory,
            file_url: `file://${directoryName}`,
            file_size: 0,
        });
        ava.is(!!result, true);
    }
});

test(`${namespace} - createDirectory - directory is tool long`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const directoryName = new Array(300).fill("a").join("");

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    await ava.throwsAsync(cloudStorageDirectorySVC.create("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - createDirectory - parent directory does not exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const parentDirectoryPath = `/${v4()}/`;

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    const directoryName = v4();
    await ava.throwsAsync(cloudStorageDirectorySVC.create(parentDirectoryPath, directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParentDirectoryNotExists}`,
    });
});

test(`${namespace} - createDirectory - directory already exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const directoryName = v4();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    await cloudStorageDirectorySVC.create("/", directoryName);

    await ava.throwsAsync(cloudStorageDirectorySVC.create("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });
});

test(`${namespace} - rename - directory name is same`, async ava => {
    const { t } = await useTransaction();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, v4());

    await cloudStorageDirectorySVC.rename("/", "a", "a");
    ava.pass();
});

test(`${namespace} - rename - directory is too long`, async ava => {
    const { t } = await useTransaction();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, v4());

    const parentDirectoryPath = `/${new Array(295).fill("a").join("")}/`;

    await ava.throwsAsync(cloudStorageDirectorySVC.rename(parentDirectoryPath, "a", v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - rename - directory does not exist`, async ava => {
    const { t } = await useTransaction();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, v4());

    await ava.throwsAsync(cloudStorageDirectorySVC.rename("/", "a", v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParentDirectoryNotExists}`,
    });
});

test(`${namespace} - rename - directory already exists`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();

    const [d1, d2] = await CreateCS.createDirectory(userUUID, "/", 2);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    await ava.throwsAsync(
        cloudStorageDirectorySVC.rename("/", d1.directoryName, d2.directoryName),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
        },
    );
});

test(`${namespace} - rename - success`, async ava => {
    const { t } = await useTransaction();

    const [userUUID, newDirectoryName] = [v4(), v4()];
    const [d1] = await CreateCS.createDirectory(userUUID);
    const [d2] = await CreateCS.createDirectory(userUUID, d1.directoryPath);
    const [f1, f2, f3] = await CreateCS.createFiles(userUUID, d2.directoryPath, 3);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    await cloudStorageDirectorySVC.rename(d1.directoryPath, d2.directoryName, newDirectoryName);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: "/",
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, d1.directoryName);
        ava.is(result[0].resourceType, FileResourceType.Directory);
    }

    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: d1.directoryPath,
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, newDirectoryName);
        ava.is(result[0].resourceType, FileResourceType.Directory);
    }
    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: `${d1.directoryPath}${newDirectoryName}/`,
        });

        ava.is(result.length, 3);
        ava.is(result[0].fileName, f3.fileName);
        ava.is(result[1].fileName, f2.fileName);
        ava.is(result[2].fileName, f1.fileName);
    }
});
