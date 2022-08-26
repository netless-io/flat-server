import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { v4 } from "uuid";
import { cloudStorageFilesDAO } from "../../../../dao";
import { FileConvertStep, FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { Whiteboard } from "../../../../../constants/Config";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageConvertStart } from "../start";
import sinon from "sinon";
import { ax } from "../../../../../v1/utils/Axios";
import { Schema } from "../../../../__tests__/helpers/schema";
import { CloudStorageConvertStartReturnSchema } from "../../../../services/cloud-storage/convert.schema";

const namespace = "v2.controllers.cloudStorage.convert.start";
initializeDataSource(test, namespace);

test.serial(`${namespace} - start`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const [userUUID] = v4();
    const { fileUUID } = await createCS.createFile(userUUID, "/", "1.ppt");
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
    await commitTransaction();
    await releaseRunner();

    const taskUUID = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid: taskUUID,
        },
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageConvertStart);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/convert/start",
        payload: {
            fileUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.is(resp.json().data.resourceType, FileResourceType.WhiteboardConvert);
    ava.is(resp.json().data.whiteboardConvert.taskUUID, taskUUID);
    ava.is(Schema.check(CloudStorageConvertStartReturnSchema, resp.json().data), null);

    stubAxios.restore();
});
