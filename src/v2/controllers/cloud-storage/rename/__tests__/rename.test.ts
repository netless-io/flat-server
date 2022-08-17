import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageRename } from "../";
import { v4 } from "uuid";
import { successJSON } from "../../../internal/utils/response-json";
import { CloudStorageInfoService } from "../../../../services/cloud-storage/info";
import { ids } from "../../../../__tests__/helpers/fastify/ids";
import { testService } from "../../../../__tests__/helpers/db";

const namespace = "v2.controllers.cloud-storage.rename";

initializeDataSource(test, namespace);

test(`${namespace} - rename dir success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID, newDirectoryName] = [v4(), v4()];

    const dir = await createCS.createDirectory(userUUID);
    const [f1, f2] = await createCS.createFiles(userUUID, dir.directoryPath, 2);

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageRename);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/rename",
        payload: {
            fileUUID: dir.fileUUID,
            newName: newDirectoryName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    {
        const result = await new CloudStorageInfoService(ids(), t, userUUID).list({
            directoryPath: "/",
            size: 10,
            page: 1,
            order: "DESC",
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, newDirectoryName);
    }

    {
        const result = await new CloudStorageInfoService(ids(), t, userUUID).list({
            directoryPath: `/${newDirectoryName}/`,
            size: 10,
            page: 1,
            order: "DESC",
        });

        ava.is(result.length, 2);
        ava.is(result[0].fileName, f2.fileName);
        ava.is(result[1].fileName, f1.fileName);

        await releaseRunner();
    }
});
