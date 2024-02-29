export const RedisKey = {
    authUUID: (uuid: string): string => `auth:uuid:${uuid}`,
    authFailed: (authUUID: string): string => `auth:failed:${authUUID}`,
    authUserInfo: (authUUID: string): string => `auth:userInfo:${authUUID}`,

    bindingAuthUUID: (uuid: string): string => `binding:auth:uuid:${uuid}`,
    bindingAuthStatus: (authUUID: string): string => `binding:auth:status:${authUUID}`,

    agoraRTCRoomUserToken: (roomUUID: string, uid: string | number): string =>
        `agora:rtc:room:${roomUUID}:uid:${uid}`,
    agoraRTMUserToken: (userUUID: string): string => `agora:rtm:userUUID:${userUUID}`,

    cloudStorageFileInfo: (userUUID: string, fileUUID: string): string =>
        `cloudStorage:${userUUID}:${fileUUID}`,
    cloudStorageTempPhotoInfo: (userUUID: string, fileUUID: string): string =>
        `cloudStorage:tempPhoto:${userUUID}:${fileUUID}`,

    userAvatarFileInfo: (userUUID: string, fileUUID: string): string =>
        `user:avatar:${userUUID}:${fileUUID}`,

    roomInviteCode: (inviteCode: string): string => `room:invite:${inviteCode}`,
    roomInviteCodeParse: (inviteCodeKey: string): string =>
        inviteCodeKey.slice("room:invite:".length),
    roomInviteCodeReverse: (roomUUID: string): string => `room:inviteReverse:${roomUUID}`,

    phoneLogin: (phone: string): string => `phone:login:${phone}`,
    phoneTryLoginCount: (phone: string): string => `phone:count:login:${phone}`,

    phoneBinding: (phone: string): string => `phone:binding:${phone}`,
    phoneTryBindingCount: (phone: string): string => `phone:count:binding:${phone}`,

    emailBinding: (email: string): string => `email:binding:${email}`,
    emailTryBindingCount: (email: string): string => `email:count:binding:${email}`,

    userDelete: (userUUID: string): string => `user:delete:${userUUID}`,

    videoIllegalCount: (roomUUID: string): string => `illegal:video:${roomUUID}`,
    voiceIllegalCount: (roomUUID: string): string => `illegal:voice:${roomUUID}`,

    oauthLogoFileInfo: (oauthUUID: string, fileUUID: string): string =>
        `oauth:logo:${oauthUUID}:${fileUUID}`,
    oauthAccessToken: (accessToken: string): string => `oauth:accessToken:${accessToken}`,
    oauthAuthorizeCode: (code: string): string => `oauth:authorize:code:${code}`,
    oauthAuthorizeCSRFToken: (oauthUUID: string, userUUID: string): string =>
        `oauth:authorize:csrfToken:${oauthUUID}:${userUUID}`,
    oauthAuthorizeScopes: (oauthUUID: string, userUUID: string): string =>
        `oauth:authorize:scopes:${oauthUUID}:${userUUID}`,
    oauthAuthorizeAccessToken: (accessToken: string): string =>
        `oauth:authorize:accessToken:${accessToken}`,
    oauthAuthorizeRefreshToken: (refreshToken: string): string =>
        `oauth:authorize:refreshToken:${refreshToken}`,
    oauthAuthorizeTokenByUserUUID: (clientID: string, userUUID: string) =>
        `oauth:authorize:clientID:${clientID}:user:${userUUID}`,

    phoneRegisterOrReset: (phone: string): string => `phone:register:${phone}`,
    phoneTryRegisterOrResetCount: (phone: string): string => `phone:count:register:${phone}`,

    emailRegisterOrReset: (email: string): string => `email:register:${email}`,
    emailTryRegisterOrResetCount: (email: string): string => `email:count:register:${email}`,

    online: (roomUUID: string): string => `online:${roomUUID}`,

    record: (roomUUID: string): string => `record:${roomUUID}`,
};
