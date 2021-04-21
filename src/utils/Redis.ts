export const RedisKey = {
    authUUID: (uuid: string): string => `auth:uuid:${uuid}`,
    authFailed: (authUUID: string): string => `auth:failed:${authUUID}`,
    authUserInfo: (authUUID: string): string => `auth:userInfo:${authUUID}`,
    wechatRefreshToken: (userUUID: string): string => `weChat:refresh:uuid:${userUUID}`,
    agoraRTCRoomUserToken: (roomUUID: string, uid: string | number): string =>
        `agora:rtc:room:${roomUUID}:uid:${uid}`,
    agoraRTMUserToken: (userUUID: string): string => `agora:rtm:userUUID:${userUUID}`,
    cloudStorageFileInfo: (userUUID: string, fileUUID: string): string =>
        `cloudStorage:${userUUID}:${fileUUID}`,
};
