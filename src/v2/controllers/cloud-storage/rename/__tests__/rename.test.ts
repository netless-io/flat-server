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
import { stub } from "sinon";
import * as sl from "../../../../service-locator";

const namespace = "v2.controllers.cloud-storage.rename";

initializeDataSource(test, namespace);

test.serial(`${namespace} - rename dir success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID, newDirectoryName] = [v4(), v4()];

    const dir = await createCS.createDirectory(userUUID);
    const [f1, f2] = await createCS.createFiles(userUUID, dir.directoryPath, 2);

    await commitTransaction();

    // @ts-ignore
    const complianceTextStub = stub(sl, "useOnceService").returns({
        assertTextNormal: () => Promise.resolve(void 0),
    });

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
    }

    complianceTextStub.restore();
    await releaseRunner();
});

test.serial(`${namespace} - rename file`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const [userUUID, newFileName] = [v4(), v4()];

    const f1 = await createCS.createFile(userUUID);

    await commitTransaction();

    // @ts-ignore
    const useOnceService = stub(sl, "useOnceService").returns({
        rename: () => Promise.resolve(),
        assertTextNormal: () => Promise.resolve(void 0),
    });

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageRename);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/rename",
        payload: {
            fileUUID: f1.fileUUID,
            newName: newFileName,
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
        ava.is(result[0].fileName, newFileName);
    }

    useOnceService.restore();

    await releaseRunner();
});
