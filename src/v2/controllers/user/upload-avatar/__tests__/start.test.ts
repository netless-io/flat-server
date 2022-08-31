import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import * as sl from "../../../../service-locator";
import { stub } from "sinon";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { userRouters } from "../../routes";
import { userUploadAvatarStart } from "../start";
import { v4 } from "uuid";

const namespace = "v2.controllers.user.upload-avatar.start";
initializeDataSource(test, namespace);

test.serial(`${namespace} - start`, async ava => {
    // @ts-ignore
    const useOnceService = stub(sl, "useOnceService").returns({
        policyTemplate: () => ({ policy: "x", signature: "y" }),
    });

    const [userUUID, fileName, fileSize] = [v4(), `${v4()}.png`, 12];

    const helpAPI = new HelperAPI();
    await helpAPI.import(userRouters, userUploadAvatarStart);
    const resp = await helpAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/user/upload-avatar/start",
        payload: {
            fileName,
            fileSize,
        },
    });

    ava.is(resp.statusCode, 200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ava.true(resp.json().data.ossFilePath.endsWith("png"));

    useOnceService.restore();
});
