import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v4 } from "uuid";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageDirectoryCreate } from "../";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../../dao";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";

const namespace = "v2.controllers.cloud-storage.directory.create";

initializeDataSource(test, namespace);

test.serial(`${namespace} - create success`, async ava => {
    ava.plan(5);
    const { t, releaseRunner } = await useTransaction();
    const helperAPI = new HelperAPI();
    const [userUUID, directoryName] = [v4(), v4()];

    // @ts-ignore
    const complianceTextStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
    });

    await helperAPI.import(cloudStorageRouters, cloudStorageDirectoryCreate);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/create-directory",
        payload: {
            parentDirectoryPath: "/",
            directoryName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.truthy(resp.json().data.fileUUID);

    const { file_uuid } = await cloudStorageUserFilesDAO.findOne(t, "file_uuid", {
        user_uuid: userUUID,
    });

    const result = await cloudStorageFilesDAO.findOne(
        t,
        ["directory_path", "file_name", "resource_type"],
        {
            file_uuid,
        },
    );

    if (result) {
        ava.is(result.directory_path, "/");
        ava.is(result.file_name, directoryName);
        ava.is(result.resource_type, FileResourceType.Directory);
    }

    complianceTextStub.restore();
    await releaseRunner();
});
