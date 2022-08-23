import test from "ava";
import sinon from "sinon";
import { ax } from "../../../../v1/utils/Axios";
import { v4 } from "uuid";
import { WhiteboardRoomService } from "../room";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { Region } from "../../../../constants/Project";

const namespace = "v2.services.whiteboard.room";

test.serial(`${namespace} - create`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "post").resolves({
        data: {
            uuid,
        },
    });

    const whiteboardRoomSVC = new WhiteboardRoomService(ids());

    const data = await whiteboardRoomSVC.create(Region.SG, 10);

    ava.is(data, uuid);

    ava.is(stubAxios.firstCall.args[0], "https://api.netless.link/v5/rooms");
    ava.deepEqual(stubAxios.firstCall.args[1], {
        isRecord: true,
        limit: 10,
    });

    stubAxios.restore();
});

test.serial(`${namespace} - ban`, async ava => {
    const uuid = v4();
    const stubAxios = sinon.stub(ax, "patch").resolves({
        data: {},
    });

    const whiteboardRoomSVC = new WhiteboardRoomService(ids());

    await whiteboardRoomSVC.ban(Region.SG, uuid);

    ava.is(stubAxios.firstCall.args[0], `https://api.netless.link/v5/rooms/${uuid}`);
    ava.deepEqual(stubAxios.firstCall.args[1], {
        isBan: true,
    });

    stubAxios.restore();
});
