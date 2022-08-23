import test from "ava";
import { WhiteboardTokenService } from "../token";
import { v4 } from "uuid";

const namespace = "v2.services.whiteboard.token";

test(`${namespace} - create sdk`, ava => {
    const token = WhiteboardTokenService.createSDK(10);
    ava.true(token.startsWith("NETLESSSDK_"));
});

test(`${namespace} - create room`, ava => {
    const token = WhiteboardTokenService.createRoom(v4(), {
        readonly: true,
        lifespan: 10,
    });
    ava.true(token.startsWith("NETLESSROOM_"));
});

test(`${namespace} - create room - default value`, ava => {
    const token = WhiteboardTokenService.createRoom(v4());
    ava.true(token.startsWith("NETLESSROOM_"));
});

test(`${namespace} - create task`, ava => {
    const token = WhiteboardTokenService.createTask(v4(), 10);
    ava.true(token.startsWith("NETLESSTASK_"));
});
