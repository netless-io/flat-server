import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { v4 } from "uuid";
import { CloudStorageFileService } from "../file";
import { CloudStorageInfoService } from "../info";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../__tests__/helpers/db";

const namespace = "v2.services.cloud-storage.file";

initializeDataSource(test, namespace);

test(`${namespace} - move`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);
    const [f1, f2] = await createCS.createFiles(userUUID, d1.directoryPath, 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();
    const cloudStorageFileSVC = new CloudStorageFileService(ids(), t, userUUID);

    const files = new Map();
    files.set(f1.fileUUID, filesInfo.get(f1.fileUUID)!);
    files.set(f2.fileUUID, filesInfo.get(f2.fileUUID)!);

    await cloudStorageFileSVC.move(files, d1.directoryPath, d2.directoryPath);

    const [l1, l2] = await Promise.all([
        cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: d1.directoryPath,
        }),
        cloudStorageInfoSVC.list({
            order: "DESC",
            page: 1,
            size: 10,
            directoryPath: d2.directoryPath,
        }),
    ]);

    ava.is(l1.length, 0);
    ava.is(l2.length, 2);
    ava.is(l2[0].fileUUID, f2.fileUUID);
    ava.is(l2[1].fileUUID, f1.fileUUID);

    await releaseRunner();
});
