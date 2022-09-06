import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { v4 } from "uuid";
import { CloudStorageFileService } from "../file";
import { CloudStorageInfoService } from "../info";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { cloudStorageFilesDAO } from "../../../dao";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { infoByType } from "../../../__tests__/helpers/db/cloud-storage-files";
import path from "path";
import { SinonStub, stub } from "sinon";
import * as sl from "../../../service-locator";
import { testService } from "../../../__tests__/helpers/db";
import * as log from "../../../../logger";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "v2.services.cloud-storage.file";

initializeDataSource(test, namespace);

let useOnceService: SinonStub;
test.beforeEach(() => {
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        rename: () => Promise.resolve(),
    });
});
test.afterEach(() => {
    useOnceService.restore();
});

test.serial(`${namespace} - move`, async ava => {
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

test.serial(`${namespace} - rename - oss resource`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);
    const [fileUUID, fileURL, oldFileName, newFileName] = [
        v4(),
        `https://a.com/x/t/${v4()}.png`,
        `${v4()}.txt`,
        `${v4()}.png`,
    ];

    await createCloudStorageFiles.full({
        ...infoByType(FileResourceType.NormalResources),
        fileUUID,
        fileName: oldFileName,
    });

    const renameStub = stub().resolves();
    useOnceService.restore();
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        rename: renameStub,
    });

    const filesInfo = new Map();
    filesInfo.set(fileUUID, {
        fileName: oldFileName,
        resourceType: FileResourceType.NormalResources,
        fileURL,
    });

    const cloudStorageFileSVC = new CloudStorageFileService(ids(), t, v4());
    await cloudStorageFileSVC.rename(filesInfo, fileUUID, newFileName);

    const { file_name } = await cloudStorageFilesDAO.findOne(t, "file_name", {
        file_uuid: fileUUID,
    });

    ava.is(file_name, `${newFileName}${path.extname(oldFileName)}`);
    ava.deepEqual(renameStub.getCall(0).args, [new URL(fileURL).pathname, newFileName]);

    useOnceService.restore();
    await releaseRunner();
});

test.serial(`${namespace} - rename - oss resource failed`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);
    const [fileUUID, fileURL, oldFileName, newFileName] = [
        v4(),
        `https://a.com/x/t/${v4()}.png`,
        `${v4()}.txt`,
        `${v4()}.png`,
    ];

    await createCloudStorageFiles.full({
        ...infoByType(FileResourceType.NormalResources),
        fileUUID,
        fileName: oldFileName,
    });

    useOnceService.restore();
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        rename: () => Promise.reject(new Error("xx")),
    });

    const loggerWarnReturnStub = stub().resolves();
    // @ts-ignore
    const logger = stub(log, "createLoggerService").returns({
        warn: loggerWarnReturnStub,
        debug: () => {},
        error: () => {},
        info: () => {},
    });

    const filesInfo = new Map();
    filesInfo.set(fileUUID, {
        fileName: oldFileName,
        resourceType: FileResourceType.NormalResources,
        fileURL,
    });

    const cloudStorageFileSVC = new CloudStorageFileService(ids(), t, v4());
    await cloudStorageFileSVC.rename(filesInfo, fileUUID, newFileName);

    ava.is(loggerWarnReturnStub.getCall(0).firstArg, "rename oss file failed");

    useOnceService.restore();
    logger.restore();
    await releaseRunner();
});

test.serial(`${namespace} - get FileResourceType by fileName`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const pptFile = new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName(
        "1.ppt",
    );
    ava.is(pptFile, FileResourceType.WhiteboardConvert);

    const pptxFile = new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName(
        "1.pptx",
    );
    ava.is(pptxFile, FileResourceType.WhiteboardProjector);

    const mp4File = new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName(
        "1.mp4",
    );
    ava.is(mp4File, FileResourceType.NormalResources);

    const docFile = new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName(
        "1.doc",
    );
    ava.is(docFile, FileResourceType.WhiteboardConvert);

    const docxFile = new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName(
        "1.docx",
    );
    ava.is(docxFile, FileResourceType.WhiteboardConvert);

    ava.throws(
        () => new CloudStorageFileService(ids(), t, v4()).getFileResourceTypeByFileName("1.c"),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
        },
    );

    await releaseRunner();
});
