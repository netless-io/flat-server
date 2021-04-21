import { describe } from "mocha";
import { expect } from "chai";

import { RedisKey } from "../../src/utils/Redis";
import { v4 } from "uuid";

describe("Redis Utils", () => {
    it("Match Redis Keys", () => {
        expect(Object.keys(RedisKey)).to.have.all.members([
            "authUUID",
            "authFailed",
            "authUserInfo",
            "wechatRefreshToken",
            "agoraRTCRoomUserToken",
            "agoraRTMUserToken",
            "cloudStorageFileInfo",
        ]);
    });

    it("authUUID", () => {
        const uuid = v4();

        expect(RedisKey.authUUID(`${uuid}`)).to.equal(`auth:uuid:${uuid}`);
    });

    it("authFailed", () => {
        const uuid = v4();

        expect(RedisKey.authFailed(`${uuid}`)).to.equal(`auth:failed:${uuid}`);
    });

    it("authUserInfo", () => {
        const uuid = v4();

        expect(RedisKey.authUserInfo(`${uuid}`)).to.equal(`auth:userInfo:${uuid}`);
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
