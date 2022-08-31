import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { userRouters } from "../../routes";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../../utils/Redis";
import { v4 } from "uuid";
import { stub } from "sinon";
import * as sl from "../../../../service-locator";
import { successJSON } from "../../../internal/utils/response-json";
import { userUploadAvatarFinish } from "../finish";

const namespace = "v2.controllers.user.upload-avatar.finish";
initializeDataSource(test, namespace);

test.serial(`${namespace} - finish`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createUser } = testService(t);
    const { userUUID } = await createUser.quick();
    const fileUUID = v4();

    await commitTransaction();
    await releaseRunner();

    // @ts-ignore
    const useOnceService = stub(sl, "useOnceService").returns({
        domain: "x",
        assertExists: () => Promise.resolve(),
        assertImageNormal: () => Promise.resolve(),
    });

    await RedisService.hmset(
        RedisKey.userAvatarFileInfo(userUUID, fileUUID),
        {
            fileName: "avatar.png",
        },
        20,
    );

    const helpAPI = new HelperAPI();
    await helpAPI.import(userRouters, userUploadAvatarFinish);
    const resp = await helpAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/user/upload-avatar/finish",
        payload: {
            fileUUID,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({}));

    useOnceService.restore();
});
