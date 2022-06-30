import test from "ava";
import { cloudStorageList } from "../index";
import { cloudStorageRouters } from "../../routes";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { v4 } from "uuid";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";
import { failJSON, successJSON } from "../../../internal/utils/response-json";
import { ErrorCode } from "../../../../../ErrorCode";

const namespace = "v2.controllers.cloud-storage.list";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - empty data`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageList);

    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/list",
        payload: {
            page: 1,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(
        resp.json(),
        successJSON({
            totalUsage: 0,
            files: [],
        }),
    );
});

test(`${namespace} - no page params`, async ava => {
    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageList);

    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/list",
        payload: {},
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.ParamsCheckFailed));
});

test(`${namespace} - default params`, async ava => {
    ava.plan(6);

    const helperAPI = new HelperAPI();
    const userUUID = v4();

    await helperAPI.import(cloudStorageRouters, cloudStorageList, req => {
        ava.is(req.body.page, 1);
        ava.is(req.body.size, 50);
        ava.is(req.body.order, "ASC");
        ava.is(req.userUUID, userUUID);
        return {};
    });

    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/cloud-storage/list",
        payload: {
            page: 1,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.payload, "{}");
});
