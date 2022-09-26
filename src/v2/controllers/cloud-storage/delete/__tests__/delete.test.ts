import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v1, v4 } from "uuid";
import { cloudStorageRouters } from "../../routes";
import { ErrorCode } from "../../../../../ErrorCode";
import { cloudStorageDelete } from "../index";
import { successJSON } from "../../../internal/utils/response-json";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";

const namespace = "v2.controllers.cloud-storage.delete";
initializeDataSource(test, namespace);

test(`${namespace} - uuid not v4 format`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageDelete);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/delete",
        payload: {
            uuids: [v1()],
        },
    });

    ava.is(resp.json().code, ErrorCode.ParamsCheckFailed);
});

test(`${namespace} - uuids is empty`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageDelete);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/delete",
        payload: {
            uuids: [],
        },
    });

    ava.is(resp.json().code, ErrorCode.ParamsCheckFailed);
});

test(`${namespace} - uuids is too long`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageDelete);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/delete",
        payload: {
            uuids: Array.from({ length: 51 }, () => v4()),
        },
    });

    ava.is(resp.json().code, ErrorCode.ParamsCheckFailed);
});

test.serial(`${namespace} - execute handler`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCloudStorageConfigs, createCloudStorageFiles, createCloudStorageUserFiles } =
        testService(t);

    const { userUUID } = await createCloudStorageConfigs.fixedTotalUsage(99999999999);
    const { fileUUID } = await createCloudStorageFiles.quick(FileResourceType.NormalResources);
    await createCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, fileUUID);

    await commitTransaction();
    await releaseRunner();

    // @ts-ignore
    const useOnceService = stub(sl, "useOnceService").returns({
        remove: () => Promise.resolve(),
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageDelete);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/delete",
        payload: {
            uuids: [fileUUID],
        },
    });

    ava.deepEqual(resp.json(), successJSON({}));
    useOnceService.restore();
});
