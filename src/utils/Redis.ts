export const RedisKey = {
    authUUID: (uuid: string): string => `auth:uuid:${uuid}`,
    authFailed: (authUUID: string): string => `auth:failed:${authUUID}`,
    authUserInfo: (authUUID: string): string => `auth:userInfo:${authUUID}`,
    agoraRTCRoomUserToken: (roomUUID: string, uid: string | number): string =>
        `agora:rtc:room:${roomUUID}:uid:${uid}`,
    agoraRTMUserToken: (userUUID: string): string => `agora:rtm:userUUID:${userUUID}`,
    cloudStorageFileInfo: (userUUID: string, fileUUID: string): string =>
        `cloudStorage:${userUUID}:${fileUUID}`,
    roomInviteCode: (inviteCode: string): string => `room:invite:${inviteCode}`,
    roomInviteCodeReverse: (roomUUID: string): string => `room:inviteReverse:${roomUUID}`,
    phoneLogin: (phone: string): string => `phone:login:${phone}`,
    phoneTryLoginCount: (phone: string): string => `phone:count:login:${phone}`,
    phoneBinding: (phone: string): string => `phone:binding:${phone}`,
    phoneTryBindingCount: (phone: string): string => `phone:count:binding:${phone}`,
    userDelete: (userUUID: string): string => `user:delete:${userUUID}`,
    videoIllegalCount: (roomUUID: string): string => `illegal:video:${roomUUID}`,
    voiceIllegalCount: (roomUUID: string): string => `illegal:voice:${roomUUID}`,
};
