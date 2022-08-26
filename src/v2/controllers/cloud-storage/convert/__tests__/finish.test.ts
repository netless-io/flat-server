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
import sinon from "sinon";
import { ax } from "../../../../../v1/utils/Axios";
import { cloudStorageConvertFinish } from "../finish";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.cloudStorage.convert.finish";
initializeDataSource(test, namespace);

test.serial(`${namespace} - finish`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);
    const [userUUID] = v4();
    const { fileUUID } = await createCS.createFile(userUUID, "/", "1.pptx");
    await cloudStorageFilesDAO.update(
        t,
        {
            resource_type: FileResourceType.WhiteboardProjector,
            payload: {
                taskUUID: v4(),
                taskToken: v4(),
                region: Whiteboard.convertRegion,
                convertStep: FileConvertStep.Converting,
            },
        },
        {
            file_uuid: fileUUID,
        },
    );
    await commitTransaction();
    await releaseRunner();

    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            status: "Finished",
            progress: {},
        },
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageConvertFinish);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/convert/finish",
        payload: {
            fileUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    {
        const { t, releaseRunner } = await useTransaction();
        const result = await cloudStorageFilesDAO.findOne(t, "payload", {
            file_uuid: fileUUID,
        });

        // @ts-ignore
        ava.is(result.payload.convertStep, FileConvertStep.Done);
        await releaseRunner();
    }

    stubAxios.restore();
});
