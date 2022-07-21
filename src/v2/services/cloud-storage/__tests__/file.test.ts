import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CreateCS } from "../../../__tests__/helpers/db/create-cs-files";
import { v4 } from "uuid";
import { CloudStorageFileService } from "../file";
import { CloudStorageInfoService } from "../info";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { FilesInfo } from "../info.type";

const namespace = "v2.services.cloud-storage.file";

initializeDataSource(test, namespace);

test(`${namespace} - move`, async ava => {
    const { t } = await useTransaction();

    const userUUID = v4();
    const [d1, d2] = await CreateCS.createDirectories(userUUID, "/", 2);
    const [f1, f2] = await CreateCS.createFiles(userUUID, d1.directoryPath, 2);

    const cloudStorageInfoSVC = new CloudStorageInfoService(v4(), t, userUUID);
    const filesInfo = await cloudStorageInfoSVC.findFilesInfo();
    const cloudStorageFileSVC = new CloudStorageFileService(v4(), t, userUUID);

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
});

test(`${namespace} - move - file path too long`, async ava => {
    const { t } = await useTransaction();
    const userUUID = v4();

    const filesInfo: FilesInfo = new Map();

    filesInfo.set(v4(), {
        fileName: "v",
        directoryPath: "/",
        resourceType: FileResourceType.OnlineCourseware,
        fileURL: v4(),
        fileSize: 0,
    });
    filesInfo.set(v4(), {
        fileName: "a".repeat(395),
        directoryPath: "/",
        resourceType: FileResourceType.WhiteboardProjector,
        fileURL: v4(),
        fileSize: 0,
    });

    const cloudStorageFileSVC = new CloudStorageFileService(v4(), t, userUUID);

    await ava.throwsAsync(cloudStorageFileSVC.move(filesInfo, "/", `/${v4()}/`), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - move - path is same`, async ava => {
    const { t } = await useTransaction();
    const cloudStorageFileSVC = new CloudStorageFileService(v4(), t, v4());

    await cloudStorageFileSVC.move(new Map(), "/", "/");
    ava.pass();
});
