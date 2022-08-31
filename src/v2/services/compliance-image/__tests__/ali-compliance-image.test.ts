import test from "ava";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import { AliComplianceImageService } from "../ali-compliance-image";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { Censorship } from "../../../../constants/Config";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "v2.services.compliance-image.ali";

test.serial(`${namespace} - image is porn`, async ava => {
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

    const aliComplianceImageService = new AliComplianceImageService(ids());
    const result = await aliComplianceImageService.imageNormal("xx");

    ava.false(result);

    stubAxios.restore();
});

test.serial(`${namespace} - image is normal`, async ava => {
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

    const aliComplianceImageService = new AliComplianceImageService(ids());
    const result = await aliComplianceImageService.imageNormal("xx");

    ava.true(result);

    stubAxios.restore();
});

test.serial(`${namespace} - request false`, async ava => {
    const stubAxios = sinon.stub(ax, "post").rejects();

    const aliComplianceImageService = new AliComplianceImageService(ids());
    const result = await aliComplianceImageService.imageNormal("xx");

    ava.true(result);

    stubAxios.restore();
});

test.serial(`${namespace} - censorship disable`, async ava => {
    const censorshipImageEnable = sinon.stub(Censorship.video, "enable").get(() => false);

    const aliComplianceImageService = new AliComplianceImageService(ids());
    const result = await aliComplianceImageService.imageNormal("xx");

    ava.true(result);

    censorshipImageEnable.restore();
});

test.serial(`${namespace} - assertImageNormal - image is porn`, async ava => {
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

    const aliComplianceImageService = new AliComplianceImageService(ids());
    await ava.throwsAsync(() => aliComplianceImageService.assertImageNormal("xx"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.NonCompliant}`,
    });

    stubAxios.restore();
});
