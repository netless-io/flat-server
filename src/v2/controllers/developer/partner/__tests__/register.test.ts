import test from "ava";
import { v4 } from "uuid";
import { ErrorCode } from "../../../../../ErrorCode";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { testService } from "../../../../__tests__/helpers/db";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { randomPhoneNumber } from "../../../../__tests__/helpers/db/user-phone";
import { failJSON, successJSON } from "../../../internal/utils/response-json";
import { developerOAuthRouters } from "../../routes";
import { developerPartnerRegister } from "../register";

const namespace = "v2.controllers.developer.partner.register";
initializeDataSource(test, namespace);

test(`${namespace} - success no user`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createPartner } = testService(t);

    const phoneNumber = randomPhoneNumber();
    const { partnerUUID } = await createPartner.quick();

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerPartnerRegister);
    const resp = await helperAPI.injectPartner(partnerUUID, {
        method: "POST",
        url: "/v2/developer/partner/register",
        payload: {
            account: phoneNumber,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({ userUUID: null }));

    await releaseRunner();
});

test(`${namespace} - success`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone, createPartner } = testService(t);

    const { userUUID } = await createUser.quick();
    const { phoneNumber } = await createUserPhone.quick({ userUUID });
    const { partnerUUID } = await createPartner.quick();

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerPartnerRegister);
    const resp = await helperAPI.injectPartner(partnerUUID, {
        method: "POST",
        url: "/v2/developer/partner/register",
        payload: {
            account: phoneNumber,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), successJSON({ userUUID }));

    await releaseRunner();
});

test(`${namespace} - not found partner`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone } = testService(t);

    const { userUUID } = await createUser.quick();
    const { phoneNumber } = await createUserPhone.quick({ userUUID });
    const partnerUUID = v4();

    await commitTransaction();

    const helperAPI = new HelperAPI();
    await helperAPI.import(developerOAuthRouters, developerPartnerRegister);
    const resp = await helperAPI.injectPartner(partnerUUID, {
        method: "POST",
        url: "/v2/developer/partner/register",
        payload: {
            account: phoneNumber,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(resp.json(), failJSON(ErrorCode.PartnerNotFound));

    await releaseRunner();
});
