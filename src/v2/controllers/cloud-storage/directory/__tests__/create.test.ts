import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v4 } from "uuid";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageDirectoryCreate } from "../create";
import { successJSON } from "../../../internal/utils/response-json";
import { cloudStorageFilesDAO, cloudStorageUserFilesDAO } from "../../../../dao";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";

const namespace = "v2.controllers.cloud-storage.directory.create";

initializeDataSource(test, namespace);

test(`${namespace} - create success`, async ava => {
    const { t } = await useTransaction();
    const helperAPI = new HelperAPI();
    const [userUUID, directoryName] = [v4(), v4()];

    await helperAPI.import(cloudStorageRouters, cloudStorageDirectoryCreate);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/directory/create",
        payload: {
            parentDirectoryPath: "/",
            directoryName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    const { file_uuid } = await cloudStorageUserFilesDAO.findOne(t, "file_uuid", {
        user_uuid: userUUID,
    });

    const result = await cloudStorageFilesDAO.findOne(t, "directory_name", {
        file_uuid,
    });

    ava.is(result.directory_name, `/${directoryName}/`);
});
