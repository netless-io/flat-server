import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { v4 } from "uuid";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageUploadFinish } from "../finish";
import { successJSON } from "../../../internal/utils/response-json";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";

const namespace = "v2.controllers.cloudStorage.upload.finish";
initializeDataSource(test, namespace);

test.serial(`${namespace} - upload finish`, async ava => {
    // @ts-ignore
    const useOnceServiceStub = stub(sl, "useOnceService").returns({
        assertExists: () => Promise.resolve(void 0),
    });

    const [userUUID, fileUUID, fileName, fileSize, targetDirectoryPath, fileResourceType] = [
        v4(),
        v4(),
        "x.ppt",
        20,
        "/",
        FileResourceType.WhiteboardConvert,
    ];

    await RedisService.hmset(
        RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
        {
            fileName,
            fileSize: String(fileSize),
            targetDirectoryPath,
            fileResourceType,
        },
        60 * 20,
    );

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageUploadFinish);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/upload/finish",
        payload: {
            fileUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    useOnceServiceStub.restore();
});
