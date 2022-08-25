import test from "ava";
import { CloudStorageDeleteService } from "../delete";
import { v4 } from "uuid";
import { FileResourceType } from "../../../../model/cloudStorage/Constants";
import { infoByType } from "../../../__tests__/helpers/db/cloud-storage-files";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { cloudStorageConfigsDAO, cloudStorageUserFilesDAO } from "../../../dao";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { SinonStub, stub } from "sinon";
import * as sl from "../../../service-locator";
import * as log from "../../../../logger";
import { testService } from "../../../__tests__/helpers/db";

const namespace = "v2.services.cloud-storage.delete";

initializeDataSource(test, namespace);

let useOnceService: SinonStub;
test.beforeEach(() => {
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        remove: () => Promise.resolve(),
    });
});
test.afterEach(() => {
    useOnceService.restore();
});

test.serial(`${namespace} - get files pathname in fileURL`, ava => {
    const uuids = Array.from({ length: 4 }, () => v4());
    const [normalResourceID, whiteboardProjectorID, directoryID, whiteboardConvertID] = uuids;

    const filesInfo = new Map();
    filesInfo.set(whiteboardProjectorID, {
        fileURL: "https://oss.example.com/WhiteboardProjector.txt",
        resourceType: FileResourceType.WhiteboardProjector,
    });
    filesInfo.set(whiteboardConvertID, {
        fileURL: "https://oss.example.com/WhiteboardConvert.txt",
        resourceType: FileResourceType.WhiteboardConvert,
    });
    filesInfo.set(normalResourceID, {
        fileURL: "https://oss.example.com/NormalResources.txt",
        resourceType: FileResourceType.NormalResources,
    });
    filesInfo.set(directoryID, {
        fileURL: "https://oss.example.com/Directory.txt",
        resourceType: FileResourceType.Directory,
    });

    const result = CloudStorageDeleteService.getFilesPathnameInURL(filesInfo, uuids);

    ava.is(result.length, 3);
    result.forEach(filePathname => {
        if (filePathname.indexOf("Directory") > -1) {
            ava.fail();
        }
    });
});

test.serial(`${namespace} - get all files and dirs`, ava => {
    const uuids = Array.from({ length: 6 }, () => v4());
    const filesInfo = new Map();
    filesInfo.set(uuids[0], {
        fileName: "f1.png",
        directoryPath: "/",
        resourceType: FileResourceType.NormalResources,
    });
    filesInfo.set(uuids[1], {
        fileName: "d1",
        directoryPath: "/",
        resourceType: FileResourceType.Directory,
    });
    filesInfo.set(uuids[2], {
        fileName: "f1",
        directoryPath: "/d1/",
        resourceType: FileResourceType.NormalResources,
    });
    filesInfo.set(uuids[3], {
        fileName: "d2",
        directoryPath: "/d1/",
        resourceType: FileResourceType.Directory,
    });
    filesInfo.set(uuids[4], {
        fileName: "d3",
        directoryPath: "/d1/d2/",
        resourceType: FileResourceType.Directory,
    });
    filesInfo.set(uuids[5], {
        fileName: "f2",
        directoryPath: "/d1/d2/d3/",
        resourceType: FileResourceType.WhiteboardConvert,
    });

    const result = CloudStorageDeleteService.getAllFilesAndDirs(filesInfo, uuids[1]);

    ava.is(result.size, 5);
    ava.is(result.get(uuids[0]), undefined);
});

test.serial(`${namespace} - delete files list is empty`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const deleteSVC = new CloudStorageDeleteService(ids(), t, v4());

    await deleteSVC.delete({
        uuids: [],
    });

    ava.pass();

    await releaseRunner();
});

test.serial(`${namespace} - update total usage`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageConfigs, createCloudStorageFiles, createCloudStorageUserFiles } =
        testService(t);

    const userUUID = v4();
    const f1 = await createCloudStorageFiles.quick(FileResourceType.NormalResources);
    const d1 = await createCloudStorageFiles.createDirectory("/", v4());
    const f2 = await createCloudStorageFiles.full({
        ...infoByType(FileResourceType.NormalResources),
        directoryPath: `${d1.directoryPath}${d1.fileName}/`,
        fileName: "f2.txt",
        fileSize: 100,
    });
    await createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        f1.fileUUID,
        d1.fileUUID,
        f2.fileUUID,
    ]);
    await createCloudStorageConfigs.full({
        userUUID,
        totalUsage: f1.fileSize + f2.fileSize,
    });

    const deleteSVC = new CloudStorageDeleteService(ids(), t, userUUID);

    await deleteSVC.delete({
        uuids: [f1.fileUUID, d1.fileUUID],
    });

    const userFiles = await cloudStorageUserFilesDAO.find(t, "id", {
        user_uuid: userUUID,
    });
    ava.is(userFiles.length, 0);

    const { total_usage } = await cloudStorageConfigsDAO.findOne(t, "total_usage", {
        user_uuid: userUUID,
    });

    ava.is(total_usage, "0");

    await releaseRunner();
});

test.serial(`${namespace} - delete oss file fail`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageConfigs, createCloudStorageFiles, createCloudStorageUserFiles } =
        testService(t);

    const userUUID = v4();
    await createCloudStorageConfigs.full({
        userUUID,
        totalUsage: 10000,
    });
    const f1 = await createCloudStorageFiles.quick(FileResourceType.NormalResources);
    await createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, f1.fileUUID);

    const customError = new Error(v4());

    useOnceService.restore();
    // @ts-ignore
    useOnceService = stub(sl, "useOnceService").returns({
        remove: () => Promise.reject(customError),
    });

    const loggerWarnReturnStub = stub().resolves();
    // @ts-ignore
    const logger = stub(log, "createLoggerService").returns({
        warn: loggerWarnReturnStub,
        debug: () => {},
        error: () => {},
        info: () => {},
    });

    const deleteSVC = new CloudStorageDeleteService(ids(), t, userUUID);

    await deleteSVC.delete({
        uuids: [f1.fileUUID],
    });

    ava.is(loggerWarnReturnStub.getCall(0).firstArg, "delete oss file error");
    ava.is(loggerWarnReturnStub.getCall(0).lastArg.errorMessage, customError.message);

    logger.restore();

    await releaseRunner();
});
