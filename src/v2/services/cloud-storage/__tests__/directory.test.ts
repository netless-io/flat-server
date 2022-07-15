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

    const result = await cloudStorageDirectorySVC.existsDirectory(fullDirectoryPath);
    ava.is(result, true);
    ava.is(Schema.check(existsDirectorySchema, result), null);
});

test(`${namespace} - existsDirectory - should return true when directory is /`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    ava.is(await cloudStorageDirectorySVC.existsDirectory("/"), true);
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

    ava.is(await cloudStorageDirectorySVC.existsDirectory(`/${v4()}/`), false);
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
    await cloudStorageDirectorySVC.createDirectory(parentDirectoryPath, directoryName);

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

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);

    await ava.throwsAsync(cloudStorageDirectorySVC.createDirectory("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - createDirectory - parent directory does not exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const parentDirectory = `/${v4()}/`;

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    const directoryName = v4();
    await ava.throwsAsync(
        cloudStorageDirectorySVC.createDirectory(parentDirectory, directoryName),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.ParentDirectoryNotExists}`,
        },
    );
});

test(`${namespace} - createDirectory - directory already exist`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const directoryName = v4();

    const cloudStorageDirectorySVC = new CloudStorageDirectoryService(v4(), t, userUUID);
    await cloudStorageDirectorySVC.createDirectory("/", directoryName);

    await ava.throwsAsync(cloudStorageDirectorySVC.createDirectory("/", directoryName), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.DirectoryAlreadyExists}`,
    });
});
