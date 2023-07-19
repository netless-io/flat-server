import test from "ava";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { CloudStorageConvertService } from "../convert";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { v4 } from "uuid";
import { FError } from "../../../../error/ControllerError";
import { Region, Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { testService } from "../../../__tests__/helpers/db";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import {
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../../model/cloudStorage/Types";
import { cloudStorageFilesDAO } from "../../../dao";
import { infoByType } from "../../../__tests__/helpers/db/cloud-storage-files";
import { Whiteboard } from "../../../../constants/Config";
import { Schema } from "../../../__tests__/helpers/schema";
import { CloudStorageConvertStartReturnSchema } from "../convert.schema";

const namespace = "v2.services.cloud-storage.convert";
initializeDataSource(test, namespace);

test(`${namespace} - get convert file info - not found`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(() => cloudStorageConvertSVC.getConvertFileInfo(v4()), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });

    await releaseRunner();
});

test(`${namespace} - get convert file info - found file`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const { fileUUID, fileURL, payload } = await createCS.createFile(v4());
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardProjector,
        },
        {
            file_uuid: fileUUID,
        },
    );

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    const result = await cloudStorageConvertSVC.getConvertFileInfo(fileUUID);

    ava.deepEqual(result, {
        fileResourceType: FileResourceType.WhiteboardProjector,
        payload,
        fileURL,
    });

    await releaseRunner();
});

test(`${namespace} - start whiteboard convert - convertStep not none`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.startWhiteboardConvert(v4(), v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotIsConvertNone}`,
        },
    );

    await releaseRunner();
});

test.serial(`${namespace} - start whiteboard convert - success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const fileInfo = infoByType(FileResourceType.WhiteboardConvert);
    const { fileUUID, fileURL, payload } = await createCloudStorageFiles.full({
        ...fileInfo,
        payload: {
            ...fileInfo.payload,
            convertStep: FileConvertStep.None,
        },
    });

    const taskUUID = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: taskUUID,
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());
    const result = await cloudStorageConvertSVC.startWhiteboardConvert(
        fileUUID,
        fileURL,
        payload as WhiteboardConvertPayload,
    );

    ava.is(Schema.check(CloudStorageConvertStartReturnSchema, result), null);
    ava.is(result.resourceType, FileResourceType.WhiteboardConvert);
    ava.is(result.whiteboardConvert.taskUUID, taskUUID);

    const dbResult = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(dbResult.payload.taskUUID, taskUUID);
    // @ts-ignore
    ava.is(dbResult.payload.convertStep, FileConvertStep.Converting);

    stubAxios.restore();
    await releaseRunner();
});

test(`${namespace} - finish whiteboard convert - convertStep already Done`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardConvert(v4(), {
        region: Region.SG,
        convertStep: FileConvertStep.Done,
    });

    ava.pass();
    await releaseRunner();
});

test(`${namespace} - finish whiteboard convert - convertStep not converting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardConvert(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.None,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotIsConverting}`,
        },
    );

    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard convert - status is Waiting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Waiting",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardConvert(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileIsConvertWaiting}`,
        },
    );

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard convert - status is Converting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Converting",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardConvert(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileIsConverting}`,
        },
    );

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard convert - status is Finished`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const { fileUUID } = await createCloudStorageFiles.quick(FileResourceType.WhiteboardConvert);

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Finished",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardConvert(fileUUID, {
        region: Region.SG,
        convertStep: FileConvertStep.Converting,
    });

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Done);

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard convert - status is Fail`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const { fileUUID } = await createCloudStorageFiles.quick(FileResourceType.WhiteboardConvert);

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Fail",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardConvert(fileUUID, {
        region: Region.SG,
        convertStep: FileConvertStep.Converting,
    });

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Failed);

    stubAxios.restore();
    await releaseRunner();
});

test(`${namespace} - start whiteboard projector - convertStep not none`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.startWhiteboardProjector(v4(), v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotIsConvertNone}`,
        },
    );

    await releaseRunner();
});

test.serial(`${namespace} - start whiteboard projector - failed`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: undefined,
        },
    });

    const { t, releaseRunner } = await useTransaction();

    const fileUUID = v4();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, fileUUID);

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.startWhiteboardProjector(v4(), v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            // it won't start when step != None
            message: `${Status.Failed}: ${ErrorCode.FileNotIsConvertNone}`,
        },
    );

    const data = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    ava.is((data.payload as any)?.convertStep, undefined);

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - start whiteboard projector - success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const fileInfo = infoByType(FileResourceType.WhiteboardProjector);
    const { fileUUID, fileURL, payload } = await createCloudStorageFiles.full({
        ...fileInfo,
        payload: {
            ...fileInfo.payload,
            convertStep: FileConvertStep.None,
        },
    });

    const taskUUID = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: taskUUID,
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());
    const result = await cloudStorageConvertSVC.startWhiteboardProjector(
        fileUUID,
        fileURL,
        payload as WhiteboardProjectorPayload,
    );

    ava.is(Schema.check(CloudStorageConvertStartReturnSchema, result), null);
    ava.is(result.resourceType, FileResourceType.WhiteboardProjector);
    ava.is(result.whiteboardProjector.taskUUID, taskUUID);

    const dbResult = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(dbResult.payload.taskUUID, taskUUID);
    // @ts-ignore
    ava.is(dbResult.payload.convertStep, FileConvertStep.Converting);

    stubAxios.restore();
    await releaseRunner();
});

test(`${namespace} - finish whiteboard projector - convertStep already Done`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardProjector(v4(), {
        region: Region.SG,
        convertStep: FileConvertStep.Done,
    });

    ava.pass();
    await releaseRunner();
});

test(`${namespace} - finish whiteboard projector - convertStep not converting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardProjector(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.None,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileNotIsConverting}`,
        },
    );

    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard projector - status is Waiting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Waiting",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardProjector(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileIsConvertWaiting}`,
        },
    );

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard projector - status is Converting`, async ava => {
    const { t, releaseRunner } = await useTransaction();

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Converting",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await ava.throwsAsync(
        () =>
            cloudStorageConvertSVC.finishWhiteboardProjector(v4(), {
                region: Region.SG,
                convertStep: FileConvertStep.Converting,
            }),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.FileIsConverting}`,
        },
    );

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard projector - status is Finished`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const { fileUUID } = await createCloudStorageFiles.quick(FileResourceType.WhiteboardProjector);

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Finished",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardProjector(fileUUID, {
        region: Region.SG,
        convertStep: FileConvertStep.Converting,
    });

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Done);

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish whiteboard projector - status is Fail`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCloudStorageFiles } = testService(t);

    const { fileUUID } = await createCloudStorageFiles.quick(FileResourceType.WhiteboardProjector);

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Fail",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, v4());

    await cloudStorageConvertSVC.finishWhiteboardProjector(fileUUID, {
        region: Region.SG,
        convertStep: FileConvertStep.Converting,
    });

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Failed);

    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - start - WhiteboardConvert`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const userUUID = v4();
    const { fileUUID } = await createCS.createFile(userUUID);
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardConvert,
            payload: {
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.None,
            },
        },
        {
            file_uuid: fileUUID,
        },
    );

    const taskUUID = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: taskUUID,
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, userUUID);
    await cloudStorageConvertSVC.start(fileUUID);

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.taskUUID, taskUUID);
    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - start - WhiteboardProjector`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const userUUID = v4();
    const { fileUUID } = await createCS.createFile(userUUID);
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardProjector,
            payload: {
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.None,
            },
        },
        {
            file_uuid: fileUUID,
        },
    );

    const taskUUID = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: taskUUID,
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, userUUID);
    await cloudStorageConvertSVC.start(fileUUID);

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.taskUUID, taskUUID);
    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish - WhiteboardConvert`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const [userUUID, taskUUID] = [v4(), v4()];
    const { fileUUID } = await createCS.createFile(userUUID);
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardConvert,
            payload: {
                taskUUID,
                taskToken: v4(),
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.Converting,
            },
        },
        {
            file_uuid: fileUUID,
        },
    );

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Finished",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, userUUID);
    await cloudStorageConvertSVC.finish(fileUUID);

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Done);
    stubAxios.restore();
    await releaseRunner();
});

test.serial(`${namespace} - finish - WhiteboardProjector`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const [userUUID, taskUUID] = [v4(), v4()];
    const { fileUUID } = await createCS.createFile(userUUID);
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardProjector,
            payload: {
                taskUUID,
                taskToken: v4(),
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.Converting,
            },
        },
        {
            file_uuid: fileUUID,
        },
    );

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Finished",
            progress: {},
        },
    });

    const cloudStorageConvertSVC = new CloudStorageConvertService(ids(), t, userUUID);
    await cloudStorageConvertSVC.finish(fileUUID);

    const result = await cloudStorageFilesDAO.findOne(t, "payload", {
        file_uuid: fileUUID,
    });

    // @ts-ignore
    ava.is(result.payload.convertStep, FileConvertStep.Done);
    stubAxios.restore();
    await releaseRunner();
});
