import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { v4 } from "uuid";
import { CloudStorageMoveService } from "../move";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageInfoService } from "../info";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../__tests__/helpers/db";

const namespace = "v2.services.cloud-storage.move";

initializeDataSource(test, namespace);

test(`${namespace} - file not found`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const [userUUID] = [v4(), v4()];

    const cloudStorageMoveSVC = new CloudStorageMoveService(ids(), t, userUUID);
    await ava.throwsAsync(
        cloudStorageMoveSVC.move({
            targetDirectoryPath: "/",
            uuids: [v4()],
        }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - path same`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();
    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);

    const cloudStorageMoveSVC = new CloudStorageMoveService(ids(), t, userUUID);
    await cloudStorageMoveSVC.move({
        targetDirectoryPath: "/",
        uuids: [d1.fileUUID, d2.fileUUID],
    });

    ava.pass();
    await releaseRunner();
});

test(`${namespace} - target directory does not exist`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const userUUID = v4();

    const f1 = await createCS.createFile(userUUID);

    const cloudStorageMoveSVC = new CloudStorageMoveService(ids(), t, userUUID);
    await ava.throwsAsync(
        cloudStorageMoveSVC.move({
            targetDirectoryPath: "/a/",
            uuids: [f1.fileUUID],
        }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.DirectoryNotExists}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - success execute`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID] = [v4(), v4()];

    /**
     * /
     *      d1/
     *          f2
     *      d2/
     *      d3/
     *          f3
     *      f1
     */
    const f1 = await createCS.createFile(userUUID);
    const [d1, d2, d3] = await createCS.createDirectories(userUUID, "/", 3);
    const f2 = await createCS.createFile(userUUID, d1.directoryPath);

    /**
     * /
     *      d2/
     *          d1/
     *              f2
     *          f1
     *          f3
     *      d3/
     */
    const cloudStorageMoveSVC = new CloudStorageMoveService(ids(), t, userUUID);
    await cloudStorageMoveSVC.move({
        targetDirectoryPath: d2.directoryPath,
        uuids: [d1.fileUUID, f1.fileUUID],
    });

    const cloudStorageInfoSVC = new CloudStorageInfoService(ids(), t, userUUID);
    const [l1, l2, l3, l4] = await Promise.all([
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
            directoryPath: d3.directoryPath,
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
            directoryPath: `${d2.directoryPath}${d1.directoryName}/`,
        }),
    ]);

    ava.is(l1.length, 2);
    ava.is(l1[0].fileUUID, d3.fileUUID);
    ava.is(l1[1].fileUUID, d2.fileUUID);

    ava.is(l2.length, 0);

    ava.is(l3.length, 2);
    ava.is(l3[0].fileUUID, d1.fileUUID);
    ava.is(l3[1].fileUUID, f1.fileUUID);

    ava.is(l4.length, 1);
    ava.is(l4[0].fileUUID, f2.fileUUID);

    await releaseRunner();
});
