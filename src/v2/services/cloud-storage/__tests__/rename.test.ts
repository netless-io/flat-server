import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CloudStorageRenameService } from "../rename";
import { v4 } from "uuid";
import { cloudStorageFilesDAO } from "../../../dao";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { FError } from "../../../../error/ControllerError";
import { CreateCS } from "../../../__tests__/helpers/db/create-cs-files";

const namespace = "service.cloud-storage.rename";

initializeDataSource(test, namespace);

test(`${namespace} - rename - cloud storage is empty`, async ava => {
    const { t } = await useTransaction();

    const cloudStorageRenameSVC = new CloudStorageRenameService(v4(), t, v4());

    await ava.throwsAsync(() => cloudStorageRenameSVC.rename(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });
});

test(`${namespace} - rename - not found file`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    await CreateCS.createDirectory(userUUID, "/");

    const cloudStorageRenameSVC = new CloudStorageRenameService(v4(), t, userUUID);

    await ava.throwsAsync(() => cloudStorageRenameSVC.rename(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });
});

test(`${namespace} - rename - directory`, async ava => {
    const { t } = await useTransaction();

    const [userUUID, newName] = [v4(), v4()];
    const dir = await CreateCS.createDirectory(userUUID);

    const cloudStorageRenameSVC = new CloudStorageRenameService(v4(), t, userUUID);

    await cloudStorageRenameSVC.rename(dir.fileUUID, newName);

    {
        const result = await cloudStorageFilesDAO.findOne(t, "file_name", {
            file_uuid: dir.fileUUID,
        });

        ava.is(result.file_name, newName);
    }
});
