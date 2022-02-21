import test from "ava";
import {
    createWhiteboardRoomToken,
    createWhiteboardSDKToken,
    createWhiteboardTaskToken,
    TokenPrefix,
    TokenRole,
} from "../NetlessToken";
import queryString from "querystring";
import { Whiteboard } from "../../constants/Config";
import { v4 } from "uuid";

const namespace = "[utils][utils-netless-token]";

test(`${namespace} - createWhiteboardSDKToken`, ava => {
    const expireAtOffset = Date.now() - 1000;

    const sdkToken = createWhiteboardSDKToken(1);

    ava.true(sdkToken.startsWith(TokenPrefix.SDK));

    const realSDKToken = sdkToken.slice(TokenPrefix.SDK.length);

    const encodeSDKToken = Buffer.from(realSDKToken, "base64").toString();

    const tokenObject = queryString.parse(encodeSDKToken) as Record<
        "ak" | "expireAt" | "nonce" | "role" | "sig",
        string
    >;

    ava.deepEqual(Object.keys(tokenObject).sort(), ["ak", "expireAt", "nonce", "role", "sig"]);

    ava.is(tokenObject.ak, Whiteboard.accessKey);

    ava.true(Number(tokenObject.expireAt) >= expireAtOffset);
    ava.true(Number(tokenObject.expireAt) <= Date.now());
});

test(`${namespace} - createWhiteboardSDKToken default value`, ava => {
    const expireAtOffset = Date.now() - 1000 * 60 * 10 - 1000;
    const sdkToken = createWhiteboardSDKToken();

    const realSDKToken = sdkToken.slice(TokenPrefix.SDK.length);

    const encodeSDKToken = Buffer.from(realSDKToken, "base64").toString();

    const tokenObject = queryString.parse(encodeSDKToken) as Record<
        "ak" | "expireAt" | "nonce" | "role" | "sig",
        string
    >;

    ava.true(Number(tokenObject.expireAt) >= expireAtOffset);
    ava.true(Number(tokenObject.expireAt) <= Date.now() + 1000 * 60 * 10);
});

test(`${namespace} - createWhiteboardRoomToken`, ava => {
    const roomUUID = v4();
    const roomToken = createWhiteboardRoomToken(roomUUID, {
        lifespan: 0,
        readonly: true,
    });

    ava.true(roomToken.startsWith(TokenPrefix.ROOM));

    const realRoomToken = roomToken.slice(TokenPrefix.ROOM.length);

    const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

    const tokenObject = queryString.parse(encodeRoomToken) as Record<
        "ak" | "nonce" | "role" | "sig" | "uuid",
        string
    >;

    ava.deepEqual(Object.keys(tokenObject).sort(), ["ak", "nonce", "role", "sig", "uuid"]);

    ava.is(tokenObject.ak, Whiteboard.accessKey);
    ava.is(tokenObject.uuid, roomUUID);
    ava.is(tokenObject.role, TokenRole.Reader);
});

test(`${namespace} - createWhiteboardRoomToken default value`, ava => {
    const roomUUID = v4();
    const roomToken = createWhiteboardRoomToken(roomUUID);

    const realRoomToken = roomToken.slice(TokenPrefix.ROOM.length);

    const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

    const tokenObject = queryString.parse(encodeRoomToken) as Record<
        "ak" | "nonce" | "role" | "sig" | "uuid",
        string
    >;

    ava.is(tokenObject.ak, Whiteboard.accessKey);
    ava.is(tokenObject.uuid, roomUUID);
    ava.is(tokenObject.role, TokenRole.Writer);
});

test(`${namespace} - createWhiteboardTaskToken`, ava => {
    const roomUUID = v4();
    const roomToken = createWhiteboardTaskToken(roomUUID, {
        lifespan: 0,
    });

    ava.true(roomToken.startsWith(TokenPrefix.TASK));

    const realRoomToken = roomToken.slice(TokenPrefix.TASK.length);

    const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

    const tokenObject = queryString.parse(encodeRoomToken) as Record<
        "ak" | "nonce" | "role" | "sig" | "uuid",
        string
    >;

    ava.deepEqual(Object.keys(tokenObject).sort(), ["ak", "nonce", "role", "sig", "uuid"]);

    ava.is(tokenObject.ak, Whiteboard.accessKey);
    ava.is(tokenObject.uuid, roomUUID);
    ava.is(tokenObject.role, TokenRole.Reader);
});

test(`${namespace} - createWhiteboardTaskToken default value`, ava => {
    const roomUUID = v4();
    const roomToken = createWhiteboardTaskToken(roomUUID);

    const realRoomToken = roomToken.slice(TokenPrefix.TASK.length);

    const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

    const tokenObject = queryString.parse(encodeRoomToken) as Record<
        "ak" | "nonce" | "role" | "sig" | "uuid",
        string
    >;

    ava.is(tokenObject.ak, Whiteboard.accessKey);
    ava.is(tokenObject.uuid, roomUUID);
    ava.is(tokenObject.role, TokenRole.Reader);
});
