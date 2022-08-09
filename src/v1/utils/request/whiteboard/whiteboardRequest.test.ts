import test from "ava";
import sinon from "sinon";
import { ax } from "../../Axios";
import {
    whiteboardBanRoom,
    whiteboardCreateConversionTask,
    whiteboardCreateRoom,
    whiteboardQueryConversionTask,
} from "./WhiteboardRequest";
import { Region } from "../../../../constants/Project";
import { v4 } from "uuid";

const namespace = "[utils][utils-request][utils-request-whiteboard]";

test.serial(`${namespace} - create room`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: "1",
        }),
    );

    await whiteboardCreateRoom(Region.CN_HZ, 100);

    ava.is(stubAxios.callCount, 1);

    stubAxios.restore();
});

test.serial(`${namespace} - ban room`, async ava => {
    const stubAxios = sinon.stub(ax, "patch");

    await whiteboardBanRoom(Region.CN_HZ, v4().replace("-", ""));

    ava.is(stubAxios.callCount, 1);

    stubAxios.restore();
});

test.serial(`${namespace} - create conversion task`, async ava => {
    const stubAxios = sinon.stub(ax, "post");

    await whiteboardCreateConversionTask({} as any);

    ava.is(stubAxios.callCount, 1);

    stubAxios.restore();
});

test.serial(`${namespace} - query conversion task`, async ava => {
    const stubAxios = sinon.stub(ax, "get");

    await whiteboardQueryConversionTask("1", "static");

    ava.is(stubAxios.callCount, 1);

    stubAxios.restore();
});
