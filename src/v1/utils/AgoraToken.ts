import { RtcRole, RtcTokenBuilder, RtmRole, RtmTokenBuilder } from "agora-access-token";
import { Agora } from "../../constants/Config";
import { RedisKey } from "../../utils/Redis";
import RedisService from "../../thirdPartyService/RedisService";

const generateRTCToken = (title: string, uid: number): string => {
    return RtcTokenBuilder.buildTokenWithUid(
        Agora.appId,
        Agora.appCertificate,
        title,
        uid,
        RtcRole.PUBLISHER,
        Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    );
};

const generateRTMToken = (uid: string): string => {
    return RtmTokenBuilder.buildToken(Agora.appId, Agora.appCertificate, uid, RtmRole.Rtm_User, 0);
};

export const getRTCToken = async (roomUUID: string, rtcUID: number): Promise<string> => {
    const rtcKey = RedisKey.agoraRTCRoomUserToken(roomUUID, rtcUID);
    let rtcToken = await RedisService.get(rtcKey);

    if (rtcToken === null) {
        rtcToken = generateRTCToken(roomUUID, rtcUID);
        // 23 hour 59 minute
        await RedisService.set(rtcKey, rtcToken, 60 * 60 * 24 - 60);
    }

    return rtcToken;
};

export const getRTMToken = async (userUUID: string): Promise<string> => {
    const rtmKey = RedisKey.agoraRTMUserToken(userUUID);
    let rtmToken = await RedisService.get(rtmKey);

    if (rtmToken === null) {
        rtmToken = generateRTMToken(userUUID);
        await RedisService.set(rtmKey, rtmToken, 60 * 60 * 24 - 60);
    }

    return rtmToken;
};
