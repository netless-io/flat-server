import test from "ava";
import { HelperAPI } from "../../../__tests__/helpers/api";
import { regionConfigs, regionConfigsRouters } from "../region-configs";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";

const namespace = "v2.controllers.region.configs";
initializeDataSource(test, namespace);

test(`${namespace} - fetch region configs`, async ava => {
    const helperAPI = new HelperAPI();
    await helperAPI.import(regionConfigsRouters, regionConfigs);

    {
        const resp = await helperAPI.inject({
            method: "GET",
            url: "/v2/region/configs",
        });
        const s = resp.payload;
        console.log(s);
        ava.is(resp.statusCode, 200);
        const data = (await resp.json()).data;
        ava.true(data.login.wechatWeb);
        ava.true(data.login.wechatMobile);
        ava.true(data.login.github);
        ava.true(data.login.google);
        ava.true(data.login.apple);
        ava.true(data.login.agora);
        ava.true(data.login.sms);
        ava.false(data.login.smsForce);
        ava.is(data.server.region, "CN");
        ava.is(data.server.regionCode, 1);
    }
});
