import test from "ava";
import { v4 } from "uuid";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import { WhiteboardConversionService } from "../conversion";
import { ids } from "../../../__tests__/helpers/fastify/ids";

const namespace = "v2.services.whiteboard.conversion";

test.serial(`${namespace} - create`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid,
        },
    });

    const whiteboardConversion = new WhiteboardConversionService(ids());
    const data = await whiteboardConversion.create("x");

    ava.is(data, uuid);
    ava.is(stubAxios.firstCall.args[0], "https://api.netless.link/v5/services/conversion/tasks");
    ava.deepEqual(stubAxios.firstCall.args[1], {
        canvasVersion: false,
        pack: true,
        resource: "x",
        scale: 1.2,
        type: "static",
    });

    stubAxios.restore();
});

test.serial(`${namespace} - query`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            uuid,
            status: "Waiting",
            progress: {
                currentStep: "Extracting",
                totalPageSize: 1,
                convertedPageSize: 1,
                convertedPercentage: 1,
            },
        },
    });

    const whiteboardConversion = new WhiteboardConversionService(ids());
    await whiteboardConversion.query(uuid);

    ava.is(
        stubAxios.firstCall.args[0],
        `https://api.netless.link/v5/services/conversion/tasks/${uuid}?type=static`,
    );

    stubAxios.restore();
});

test(`${namespace} - scale by file type`, ava => {
    {
        // @ts-ignore
        const scale = WhiteboardConversionService.scaleByFileType("1.pdf");
        ava.is(scale, 2.4);
    }
    {
        // @ts-ignore
        const scale = WhiteboardConversionService.scaleByFileType("1.png");
        ava.is(scale, 1.2);
    }
});
