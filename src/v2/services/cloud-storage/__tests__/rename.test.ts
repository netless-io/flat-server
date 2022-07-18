import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CreateCloudStorageFiles } from "../../../__tests__/helpers/db/cloud-storage-files";
import { CreateCloudStorageUserFiles } from "../../../__tests__/helpers/db/cloud-storage-user-files";
import { CreateCloudStorageConfigs } from "../../../__tests__/helpers/db/cloud-storage-configs";
import { CloudStorageRenameService } from "../rename";
import { v4 } from "uuid";
import { cloudStorageFilesDAO } from "../../../dao";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { FError } from "../../../../error/ControllerError";

const namespace = "service.cloud-storage.rename";

initializeDataSource(test, namespace);

test(`${namespace} - rename - not found`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageRenameSVC = new CloudStorageRenameService(v4(), t, v4());

    await ava.throwsAsync(() => cloudStorageRenameSVC.rename(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });
});

test(`${namespace} - rename - directory`, async ava => {
    const { t } = await useTransaction();

    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const { fileUUID } = await CreateCloudStorageFiles.createDirectory("/", "test");
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    const cloudStorageRenameSVC = new CloudStorageRenameService(v4(), t, userUUID);

    await cloudStorageRenameSVC.rename(fileUUID, "test2");

    {
        const result = await cloudStorageFilesDAO.findOne(t, "file_name", {
            file_uuid: fileUUID,
        });

        ava.is(result.file_name, "test2");
    }
});
