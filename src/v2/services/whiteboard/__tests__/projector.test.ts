import test from "ava";
import { v4 } from "uuid";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { WhiteboardProjectorService } from "../projector";

const namespace = "v2.services.whiteboard.projector";

test.serial(`${namespace} - create`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid,
        },
    });

    const whiteboardProject = new WhiteboardProjectorService(ids());
    const data = await whiteboardProject.create("x");

    ava.is(data, uuid);
    ava.is(stubAxios.firstCall.args[0], "https://api.netless.link/v5/projector/tasks");
    ava.deepEqual(stubAxios.firstCall.args[1], {
        pack: false,
        preview: true,
        resource: "x",
    });

    stubAxios.restore();
});

test.serial(`${namespace} - query`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "get").resolves({
        data: {
            uuid,
            status: "Waiting",
        },
    });

    const whiteboardProject = new WhiteboardProjectorService(ids());
    await whiteboardProject.query(uuid);

    ava.is(stubAxios.firstCall.args[0], `https://api.netless.link/v5/projector/tasks/${uuid}`);

    stubAxios.restore();
});
