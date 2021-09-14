import test from "ava";
import { RedisKey } from "../Redis";
import { v4 } from "uuid";

const namespace = "[utils][utils-redis]";

test(`${namespace} - Match Redis Keys`, ava => {
    ava.deepEqual(Object.keys(RedisKey).sort(), [
        "agoraRTCRoomUserToken",
        "agoraRTMUserToken",
        "authFailed",
        "authUUID",
        "authUserInfo",
        "cloudStorageFileInfo",
    ]);
});

test(`${namespace} - authUUID`, ava => {
    const uuid = v4();

    ava.is(RedisKey.authUUID(uuid), `auth:uuid:${uuid}`);
});

test(`${namespace} - authFailed`, ava => {
    const uuid = v4();

    ava.is(RedisKey.authFailed(uuid), `auth:failed:${uuid}`);
});

test(`${namespace} - authUserInfo`, ava => {
    const uuid = v4();

    ava.is(RedisKey.authUserInfo(uuid), `auth:userInfo:${uuid}`);
});

test(`${namespace} - agoraRTCRoomUserToken`, ava => {
    const roomUUID = v4();
    const uid = 0;

    ava.is(RedisKey.agoraRTCRoomUserToken(roomUUID, uid), `agora:rtc:room:${roomUUID}:uid:${uid}`);
});

test(`${namespace} - agoraRTMUserToken`, ava => {
    const userUUID = v4();

    ava.is(RedisKey.agoraRTMUserToken(userUUID), `agora:rtm:userUUID:${userUUID}`);
});

test(`${namespace} - cloudStorageFileInfo`, ava => {
    const userUUID = v4();
    const fileUUID = v4();

    ava.is(
        RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
        `cloudStorage:${userUUID}:${fileUUID}`,
    );
});
