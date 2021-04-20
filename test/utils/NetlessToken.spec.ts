import { describe } from "mocha";
import { expect } from "chai";

import queryString from "querystring";
import { v4 } from "uuid";
import {
    createWhiteboardRoomToken,
    createWhiteboardSDKToken,
    createWhiteboardTaskToken,
    TokenPrefix,
    TokenRole,
} from "../../src/utils/NetlessToken";
import { Netless } from "../../src/Constants";

describe("NetlessToken Utils", () => {
    it("createWhiteboardSDKToken", () => {
        const expireAtOffset = Date.now() - 1000;

        const sdkToken = createWhiteboardSDKToken(1);

        expect(sdkToken.startsWith(TokenPrefix.SDK)).true;

        const realSDKToken = sdkToken.slice(TokenPrefix.SDK.length);

        const encodeSDKToken = Buffer.from(realSDKToken, "base64").toString();

        const tokenObject = queryString.parse(encodeSDKToken) as Record<
            "ak" | "expireAt" | "nonce" | "role" | "sig",
            string
        >;

        expect(Object.keys(tokenObject)).to.have.all.members([
            "ak",
            "expireAt",
            "nonce",
            "role",
            "sig",
        ]);

        expect(tokenObject.ak).equal(Netless.ACCESS_KEY);

        expect(Number(tokenObject.expireAt)).to.gte(expireAtOffset);
        expect(Number(tokenObject.expireAt)).to.lte(Date.now());
    });

    it("createWhiteboardSDKToken default value", () => {
        const expireAtOffset = Date.now() - 1000 * 60 * 10 - 1000;
        const sdkToken = createWhiteboardSDKToken();

        const realSDKToken = sdkToken.slice(TokenPrefix.SDK.length);

        const encodeSDKToken = Buffer.from(realSDKToken, "base64").toString();

        const tokenObject = queryString.parse(encodeSDKToken) as Record<
            "ak" | "expireAt" | "nonce" | "role" | "sig",
            string
        >;

        expect(Number(tokenObject.expireAt)).to.gte(expireAtOffset);
        expect(Number(tokenObject.expireAt)).to.lte(Date.now() + 1000 * 60 * 10);
    });

    it("createWhiteboardRoomToken", () => {
        const roomUUID = v4();
        const roomToken = createWhiteboardRoomToken(roomUUID, {
            lifespan: 0,
            readonly: true,
        });

        expect(roomToken.startsWith(TokenPrefix.ROOM)).true;

        const realRoomToken = roomToken.slice(TokenPrefix.ROOM.length);

        const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

        const tokenObject = queryString.parse(encodeRoomToken) as Record<
            "ak" | "nonce" | "role" | "sig" | "uuid",
            string
        >;

        expect(Object.keys(tokenObject)).to.have.all.members([
            "ak",
            "nonce",
            "role",
            "sig",
            "uuid",
        ]);

        expect(tokenObject.ak).equal(Netless.ACCESS_KEY);
        expect(tokenObject.uuid).equal(roomUUID);
        expect(tokenObject.role).equal(TokenRole.Reader);
    });

    it("createWhiteboardRoomToken default value", () => {
        const roomUUID = v4();
        const roomToken = createWhiteboardRoomToken(roomUUID);

        const realRoomToken = roomToken.slice(TokenPrefix.ROOM.length);

        const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

        const tokenObject = queryString.parse(encodeRoomToken) as Record<
            "ak" | "nonce" | "role" | "sig" | "uuid",
            string
        >;

        expect(tokenObject.ak).equal(Netless.ACCESS_KEY);
        expect(tokenObject.uuid).equal(roomUUID);
        expect(tokenObject.role).equal(TokenRole.Writer);
    });

    it("createWhiteboardTaskToken", () => {
        const roomUUID = v4();
        const roomToken = createWhiteboardTaskToken(roomUUID, {
            lifespan: 0,
        });

        expect(roomToken.startsWith(TokenPrefix.TASK)).true;

        const realRoomToken = roomToken.slice(TokenPrefix.TASK.length);

        const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

        const tokenObject = queryString.parse(encodeRoomToken) as Record<
            "ak" | "nonce" | "role" | "sig" | "uuid",
            string
        >;

        expect(Object.keys(tokenObject)).to.have.all.members([
            "ak",
            "nonce",
            "role",
            "sig",
            "uuid",
        ]);

        expect(tokenObject.ak).equal(Netless.ACCESS_KEY);
        expect(tokenObject.uuid).equal(roomUUID);
        expect(tokenObject.role).equal(TokenRole.Reader);
    });

    it("createWhiteboardTaskToken default value", () => {
        const roomUUID = v4();
        const roomToken = createWhiteboardTaskToken(roomUUID);

        const realRoomToken = roomToken.slice(TokenPrefix.TASK.length);

        const encodeRoomToken = Buffer.from(realRoomToken, "base64").toString();

        const tokenObject = queryString.parse(encodeRoomToken) as Record<
            "ak" | "nonce" | "role" | "sig" | "uuid",
            string
        >;

        expect(tokenObject.ak).equal(Netless.ACCESS_KEY);
        expect(tokenObject.uuid).equal(roomUUID);
        expect(tokenObject.role).equal(TokenRole.Reader);
    });
});
