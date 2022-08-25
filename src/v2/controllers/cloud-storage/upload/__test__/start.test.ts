import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { v4 } from "uuid";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageUploadStart } from "../start";
import { Schema } from "../../../../__tests__/helpers/schema";
import { uploadStartReturnSchema } from "../../../../services/cloud-storage/upload.schema";

const namespace = "v2.controllers.cloudStorage.upload.start";
initializeDataSource(test, namespace);

test.serial(`${namespace} - upload start`, async ava => {
    // @ts-ignore
    const useOnceServiceStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
        policyTemplate: () => ({ policy: "x", signature: "y" }),
        domain: "x",
    });

    const userUUID = v4();

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageUploadStart);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/upload/start",
        payload: {
            fileName: "x.png",
            fileSize: 20,
            targetDirectoryPath: "/",
        },
    });

    ava.is(resp.statusCode, 200);
    ava.is(Schema.check(uploadStartReturnSchema, resp.json().data), null);

    useOnceServiceStub.restore();
});
