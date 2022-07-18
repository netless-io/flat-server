import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { v4 } from "uuid";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";
import { Schema } from "../../../__tests__/helpers/schema";
import { existsDirectorySchema } from "../directory.schema";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../dao";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageDirectoryService } from "../directory";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageInfoService } from "../info";

const namespace = "services.cloud-storage.directory";

initializeDataSource(test, namespace);

test(`${namespace} - existsDirectory - should return true`, async ava => {
    const { t } = await useTransaction();

    const [userUUID, directoryPath, directoryName] = [v4(), `/${v4()}/`, v4()];
    const fullDirectoryPath = `${directoryPath}${directoryName}/`;
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory(
        directoryPath,
        directoryName,
    );
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    const result = await cloudStorageDirectorySVC.exists(fullDirectoryPath);
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

    const [userUUID, directoryPath, directoryName] = [v4(), `/${v4()}/`, v4()];
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory(
        directoryPath,
        directoryName,
    );
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.exists(`/${v4()}/`), false);
});

test(`${namespace} - createDirectory - create nested success`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const parentDirectoryName = v4();
    const parentDirectoryPath = `/${parentDirectoryName}/`;
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory("/", parentDirectoryName);
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    const directoryName = v4();
    await cloudStorageDirectorySVC.create(parentDirectoryPath, directoryName);

    {
        const result = await cloudStorageUserFilesDAO.findOne(t, "id", {
            user_uuid: userUUID,
            file_uuid: fileUUID,
        });
        ava.is(!!result, true);
    }

    {
        const result = await cloudStorageFilesDAO.findOne(t, "id", {
            file_uuid: fileUUID,
            file_name: directoryName,
            directory_path: parentDirectoryPath,
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

    const [sc, d1, d2] = await Promise.all([
        CreateCloudStorageConfigs.quick(),
        CreateCloudStorageFiles.createDirectory("/", "a"),
        CreateCloudStorageFiles.createDirectory("/", "b"),
    ]);
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(sc.userUUID, [
        d1.fileUUID,
        d2.fileUUID,
    ]);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, sc.userUUID);

    await ava.throwsAsync(cloudStorageDirectorySVC.rename("/", "a", "b"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });
});

test(`${namespace} - rename - success`, async ava => {
    const { t } = await useTransaction();

    const [parentDirectoryName, subOldDirectoryName, subNewDirectoryName] = [v4(), v4(), v4()];
    const parentDirectoryPath = `/${parentDirectoryName}/`;
    const oldDirectoryPath = `${parentDirectoryPath}${subOldDirectoryName}/`;
    const newDirectoryPath = `${parentDirectoryPath}${subNewDirectoryName}/`;

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const [f1, f2, f3, d1, d2] = [
        await CreateCloudStorageFiles.fixedDirectoryPath(oldDirectoryPath, "a.txt"),
        await CreateCloudStorageFiles.fixedDirectoryPath(oldDirectoryPath, "b.txt"),
        await CreateCloudStorageFiles.fixedDirectoryPath(oldDirectoryPath, "c.txt"),
        await CreateCloudStorageFiles.createDirectory("/", parentDirectoryName),
        await CreateCloudStorageFiles.createDirectory(parentDirectoryPath, subOldDirectoryName),
    ];
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        f2.fileUUID,
        f3.fileUUID,
        d1.fileUUID,
        d2.fileUUID,
    ]);

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    await cloudStorageDirectorySVC.rename(
        parentDirectoryPath,
        subOldDirectoryName,
        subNewDirectoryName,
    );

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: "/",
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, parentDirectoryName);
        ava.is(result[0].resourceType, FileResourceType.Directory);
    }

    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: parentDirectoryPath,
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, subNewDirectoryName);
        ava.is(result[0].resourceType, FileResourceType.Directory);
    }
    {
        const result = await cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: newDirectoryPath,
        });

        ava.is(result.length, 3);
        ava.is(result[0].fileName, "c.txt");
        ava.is(result[1].fileName, "b.txt");
        ava.is(result[2].fileName, "a.txt");
    }
});
