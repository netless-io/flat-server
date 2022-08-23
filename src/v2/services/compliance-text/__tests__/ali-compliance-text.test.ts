import test from "ava";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import { AliComplianceTextService } from "../ali-compliance-text";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { Censorship } from "../../../../constants/Config";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "v2.services.compliance-text.ali";

test.serial(`${namespace} - text is porn`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: {
                data: [
                    {
                        results: [
                            {
                                suggestion: "block",
                                label: "porn",
                            },
                        ],
                    },
                ],
            },
        }),
    );

    const aliComplianceTextService = new AliComplianceTextService(ids());
    const result = await aliComplianceTextService.textNormal("xx");

    ava.false(result);

    stubAxios.restore();
});

test.serial(`${namespace} - text is normal`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: {
                data: [
                    {
                        results: [],
                    },
                ],
            },
        }),
    );

    const aliComplianceTextService = new AliComplianceTextService(ids());
    const result = await aliComplianceTextService.textNormal("xx");

    ava.true(result);

    stubAxios.restore();
});

test.serial(`${namespace} - request false`, async ava => {
    const stubAxios = sinon.stub(ax, "post").rejects();

    const aliComplianceTextService = new AliComplianceTextService(ids());
    const result = await aliComplianceTextService.textNormal("xx");

    ava.true(result);

    stubAxios.restore();
});

test.serial(`${namespace} - censorship disable`, async ava => {
    const censorshipTextEnable = sinon.stub(Censorship.text, "enable").get(() => false);

    const aliComplianceTextService = new AliComplianceTextService(ids());
    const result = await aliComplianceTextService.textNormal("xx");

    ava.true(result);

    censorshipTextEnable.restore();
});

test.serial(`${namespace} - assertTextNormal - text is porn`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: {
                data: [
                    {
                        results: [
                            {
                                suggestion: "block",
                                label: "porn",
                            },
                        ],
                    },
                ],
            },
        }),
    );

    const aliComplianceTextService = new AliComplianceTextService(ids());
    await ava.throwsAsync(() => aliComplianceTextService.assertTextNormal("xx"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.NonCompliant}`,
    });

    stubAxios.restore();
});
