import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CloudStorageRenameService } from "../rename";
import { v4 } from "uuid";
import { cloudStorageFilesDAO } from "../../../dao";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { FError } from "../../../../error/ControllerError";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../__tests__/helpers/db";

const namespace = "service.cloud-storage.rename";

initializeDataSource(test, namespace);

test(`${namespace} - rename - cloud storage is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageRenameSVC = new CloudStorageRenameService(ids(), t, v4());

    await ava.throwsAsync(() => cloudStorageRenameSVC.rename(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - rename - not found file`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    await createCS.createDirectory(userUUID, "/");

    const cloudStorageRenameSVC = new CloudStorageRenameService(ids(), t, userUUID);

    await ava.throwsAsync(() => cloudStorageRenameSVC.rename(v4(), v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - rename - directory`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID, newName] = [v4(), v4()];
    const dir = await createCS.createDirectory(userUUID);

    const cloudStorageRenameSVC = new CloudStorageRenameService(ids(), t, userUUID);

    await cloudStorageRenameSVC.rename(dir.fileUUID, newName);

    {
        const { file_name } = await cloudStorageFilesDAO.findOne(t, "file_name", {
            file_uuid: dir.fileUUID,
        });

        ava.is(file_name, newName);
    }

    await releaseRunner();
});
