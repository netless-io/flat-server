import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v4 } from "uuid";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageMove, cloudStorageMoveSchema } from "../index";
import { Schema } from "../../../../__tests__/helpers/schema";
import { successJSON } from "../../../internal/utils/response-json";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";

const namespace = "v2.controllers.cloud-storage.move";

initializeDataSource(test, namespace);

test(`${namespace} - move - router registry success`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageMove);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/move",
        payload: {
            targetDirectoryPath: "/",
            uuids: [v4()],
        },
    });

    ava.is(resp.statusCode, 200);
});

test(`${namespace} - move - schema`, ava => {
    ava.is(
        Schema.check(cloudStorageMoveSchema.body, {
            targetDirectoryPath: "/",
            uuids: [v4()],
        }),
        null,
    );

    {
        const result = Schema.check(cloudStorageMoveSchema.body, {
            targetDirectoryPath: "a/",
            uuids: [v4()],
        });

        // @ts-ignore
        ava.is(result[0].instancePath, "/targetDirectoryPath");
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/quotes
        ava.is(result[0].message, 'must match format "directory-path"');
    }

    {
        const result = Schema.check(cloudStorageMoveSchema.body, {
            targetDirectoryPath: "/a/",
            uuids: ["a"],
        });

        // @ts-ignore
        ava.is(result[0].instancePath, "/uuids/0");
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/quotes
        ava.is(result[0].message, 'must match format "uuid-v4"');
    }
});

test(`${namespace} - move - success execute`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createCS } = testService(t);

    const helperAPI = new HelperAPI();
    const userUUID = v4();

    const [d1, d2] = await createCS.createDirectories(userUUID, "/", 2);

    await commitTransaction();
    await releaseRunner();

    await helperAPI.import(cloudStorageRouters, cloudStorageMove);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/move",
        payload: {
            targetDirectoryPath: d1.directoryPath,
            uuids: [d2.fileUUID],
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));
});
