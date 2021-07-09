import { describe } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import {
    whiteboardBanRoom,
    whiteboardCreateConversionTask,
    whiteboardCreateRoom,
    whiteboardQueryConversionTask,
} from "../../../../../src/v1/utils/request/whiteboard/WhiteboardRequest";
import { ax } from "../../../../../src/v1/utils/Axios";
import { v4 } from "uuid";
import { Region } from "../../../../../src/constants/Project";

describe("v1 Whiteboard Request", () => {
    it("create room", async () => {
        const stubAxios = sinon.stub(ax, "post").resolves(
            Promise.resolve({
                data: "1",
            }),
        );

        await whiteboardCreateRoom(Region.CN_HZ, 100);

        expect(stubAxios.callCount).eq(1);

        stubAxios.restore();
    });

    it("ban room", async () => {
        const stubAxios = sinon.stub(ax, "patch");

        await whiteboardBanRoom(Region.CN_HZ, v4().replace("-", ""));

        expect(stubAxios.callCount).eq(1);

        stubAxios.restore();
    });

    it("create conversion task", async () => {
        const stubAxios = sinon.stub(ax, "post");

        await whiteboardCreateConversionTask(Region.CN_HZ, {} as any);

        expect(stubAxios.callCount).eq(1);

        stubAxios.restore();
    });

    it("query conversion task", async () => {
        const stubAxios = sinon.stub(ax, "get");

        await whiteboardQueryConversionTask(Region.CN_HZ, "1", "static");

        expect(stubAxios.callCount).eq(1);

        stubAxios.restore();
    });
});
