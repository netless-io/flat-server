export const RedisKey = {
    weChatAuthUUID: (uuid: string): string => `weChat:auth:uuid:${uuid}`,
    wechatRefreshToken: (userUUID: string): string => `weChat:refresh:uuid:${userUUID}`,
    agoraRTCRoomUserToken: (roomUUID: string, uid: string | number): string =>
        `agora:rtc:room:${roomUUID}:uid:${uid}`,
    agoraRTMUserToken: (userUUID: string): string => `agora:rtm:userUUID:${userUUID}`,
};
