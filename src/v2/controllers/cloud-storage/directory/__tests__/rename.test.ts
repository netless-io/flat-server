import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import test from "ava";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { cloudStorageRouters } from "../../routes";
import { cloudStorageDirectoryRename } from "../rename";
import { CreateCloudStorageUserFiles } from "../../../../__tests__/helpers/db/cloud-storage-user-files";
import { CreateCloudStorageConfigs } from "../../../../__tests__/helpers/db/cloud-storage-configs";
import { CreateCloudStorageFiles } from "../../../../__tests__/helpers/db/cloud-storage-files";
import { v4 } from "uuid";
import { successJSON } from "../../../internal/utils/response-json";
import { CloudStorageInfoService } from "../../../../services/cloud-storage/info";

const namespace = "v2.controllers.cloud-storage.directory.rename";

initializeDataSource(test, namespace);

test(`${namespace} - rename success`, async ava => {
    const { t } = await useTransaction();

    const [oldDirectoryName, newDirectoryName] = [v4(), v4()];
    const directoryPath = `/${v4()}/`;
    const { userUUID } = await CreateCloudStorageConfigs.quick();
    const { fileUUID: dirUUID } = await CreateCloudStorageFiles.createDirectory(
        "/",
        oldDirectoryName,
    );
    const [f1, f2] = [
        await CreateCloudStorageFiles.fixedDirectoryPath(directoryPath, "test.txt"),
        await CreateCloudStorageFiles.fixedDirectoryPath(directoryPath, "test.png"),
    ];
    await CreateCloudStorageUserFiles.fixedUserUUIDAndFileUUID(userUUID, [
        dirUUID,
        f1.fileUUID,
        f2.fileUUID,
    ]);

    const helperAPI = new HelperAPI();
    await helperAPI.import(cloudStorageRouters, cloudStorageDirectoryRename);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/directory/rename",
        payload: {
            parentDirectoryPath: "/",
            oldDirectoryName,
            newDirectoryName,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    {
        const result = await new CloudStorageInfoService(v4(), t, userUUID).list({
            directoryPath: "/",
            size: 10,
            page: 1,
            order: "DESC",
        });

        ava.is(result.length, 1);
        ava.is(result[0].fileName, newDirectoryName);
    }

    {
        const result = await new CloudStorageInfoService(v4(), t, userUUID).list({
            directoryPath: directoryPath,
            size: 10,
            page: 1,
            order: "DESC",
        });

        ava.is(result.length, 2);
        ava.is(result[0].fileName, "test.png");
        ava.is(result[1].fileName, "test.txt");
    }
});
