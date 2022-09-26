import test from "ava";
import { initializeDataSource } from "../../../../__tests__/helpers/db/test-hooks";
import { useTransaction } from "../../../../__tests__/helpers/db/query-runner";
import { testService } from "../../../../__tests__/helpers/db";
import { v4 } from "uuid";
import { HelperAPI } from "../../../../__tests__/helpers/api";
import { applicationRouters } from "../../routes";
import { applicationList } from "../index";
import { successJSON } from "../../../internal/utils/response-json";

const namespace = "v2.controllers.application.list";
initializeDataSource(test, namespace);

test(`${namespace} - list`, async ava => {
    const { t, commitTransaction, releaseRunner } = await useTransaction();
    const { createOAuthInfos, createOAuthUsers, createUser } = testService(t);

    const userUUID = v4();
    const [oauthInfo1, oauthInfo2] = await Promise.all([
        createOAuthInfos.quick(),
        createOAuthInfos.quick(),
    ]);
    const [user1, user2] = await Promise.all([
        createUser.fixedUUID(oauthInfo1.ownerUUID),
        createUser.fixedUUID(oauthInfo2.ownerUUID),
    ]);

    await Promise.all([
        createOAuthUsers.quick({
            oauthUUID: oauthInfo1.oauthUUID,
            userUUID,
        }),
        createOAuthUsers.quick({
            oauthUUID: oauthInfo2.oauthUUID,
            userUUID,
        }),
    ]);

    await commitTransaction();
    await releaseRunner();

    const helperAPI = new HelperAPI();
    await helperAPI.import(applicationRouters, applicationList);
    const resp = await helperAPI.injectAuth(userUUID, {
        method: "POST",
        url: "/v2/application/list",
        payload: {
            page: 1,
        },
    });

    ava.is(resp.statusCode, 200);
    ava.deepEqual(
        resp.json(),
        successJSON([
            {
                ownerName: user2.userName,
                oauthUUID: oauthInfo2.oauthUUID,
                appName: oauthInfo2.appName,
                homepageURL: oauthInfo2.homepageURL,
                logoURL: oauthInfo2.logoURL,
            },
            {
                ownerName: user1.userName,
                oauthUUID: oauthInfo1.oauthUUID,
                appName: oauthInfo1.appName,
                homepageURL: oauthInfo1.homepageURL,
                logoURL: oauthInfo1.logoURL,
            },
        ]),
    );
});
