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
import {
    ClassroomResourceProfile,
    getDefaultClassroomResourceProfile,
} from "../../../../classroomResource/Registry";

const namespace = "[utils][utils-request][utils-request-whiteboard]";

const profileWithWhiteboardCredentials = (): ClassroomResourceProfile => {
    const current = getDefaultClassroomResourceProfile();
    return {
        ...current,
        whiteboard: {
            ...current.whiteboard,
            accessKey: "profile-specific-access-key",
            secretAccessKey: "profile-specific-secret-key",
            region: Region.SG,
            convertRegion: Region.SG,
        },
    };
};

const tokenAccessKey = (token: string): string | null => {
    const encoded = token.replace(/^NETLESSSDK_/, "");
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return new URLSearchParams(Buffer.from(padded, "base64").toString("utf8")).get("ak");
};

test.serial(`${namespace} - create room`, async ava => {
    const stubAxios = sinon.stub(ax, "post").resolves(
        Promise.resolve({
            data: { uuid: "whiteboard-room-1" },
        }),
    );
    ava.teardown(() => stubAxios.restore());
    const profile = profileWithWhiteboardCredentials();

    const roomUUID = await whiteboardCreateRoom(Region.SG, profile, 100);

    ava.is(roomUUID, "whiteboard-room-1");
    ava.is(stubAxios.callCount, 1);
    const [url, body, options] = stubAxios.firstCall.args;
    ava.truthy(options);
    if (!options) {
        return;
    }
    ava.is(url, "https://api.netless.link/v5/rooms");
    ava.deepEqual(body, { isRecord: true, limit: 100 });
    ava.is(options.headers.region, Region.SG);
    ava.is(tokenAccessKey(options.headers.token), profile.whiteboard.accessKey);
});

test.serial(`${namespace} - ban room`, async ava => {
    const stubAxios = sinon.stub(ax, "patch");
    ava.teardown(() => stubAxios.restore());
    const profile = profileWithWhiteboardCredentials();
    const roomUUID = v4().replace("-", "");

    await whiteboardBanRoom(Region.SG, roomUUID, profile);

    ava.is(stubAxios.callCount, 1);
    const [url, body, options] = stubAxios.firstCall.args;
    ava.truthy(options);
    if (!options) {
        return;
    }
    ava.is(url, `https://api.netless.link/v5/rooms/${roomUUID}`);
    ava.deepEqual(body, { isBan: true });
    ava.is(options.headers.region, Region.SG);
    ava.is(tokenAccessKey(options.headers.token), profile.whiteboard.accessKey);
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
