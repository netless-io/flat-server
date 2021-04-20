import { describe } from "mocha";
import { expect } from "chai";

import { RedisKey } from "../../src/utils/Redis";
import { v4 } from "uuid";

describe("Redis Utils", () => {
    it("Match Redis Keys", () => {
        expect(Object.keys(RedisKey)).to.have.all.members([
            "weChatAuthUUID",
            "wechatRefreshToken",
            "agoraRTCRoomUserToken",
            "agoraRTMUserToken",
            "cloudStorageFileInfo",
        ]);
    });

    it("weChatAuthUUID", () => {
        const uuid = v4();

        expect(RedisKey.weChatAuthUUID(`${uuid}`)).to.equal(`weChat:auth:uuid:${uuid}`);
    });

    it("wechatRefreshToken", () => {
        const userUUID = v4();

        expect(RedisKey.wechatRefreshToken(`${userUUID}`)).to.equal(
            `weChat:refresh:uuid:${userUUID}`,
        );
    });

    it("agoraRTCRoomUserToken", () => {
        const roomUUID = v4();
        const uid = 0;

        expect(RedisKey.agoraRTCRoomUserToken(`${roomUUID}`, `${uid}`)).to.equal(
            `agora:rtc:room:${roomUUID}:uid:${uid}`,
        );
    });

    it("agoraRTMUserToken", () => {
        const userUUID = v4();

        expect(RedisKey.agoraRTMUserToken(`${userUUID}`)).to.equal(
            `agora:rtm:userUUID:${userUUID}`,
        );
    });

    it("cloudStorageFileInfo", () => {
        const userUUID = v4();
        const fileUUID = v4();

        expect(RedisKey.cloudStorageFileInfo(userUUID, fileUUID)).to.equal(
            `cloudStorage:${userUUID}:${fileUUID}`,
        );
    });
});
