export const RedisKey = {
    weChatAuthUUID: (uuid: string): string => `weChat:auth:uuid:${uuid}`,
    wechatRefreshToken: (userUUID: string): string => `weChat:refresh:uuid:${userUUID}`,
};
