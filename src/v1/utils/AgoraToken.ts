import { RtcRole, RtcTokenBuilder, RtmRole, RtmTokenBuilder } from "agora-access-token";
import { Agora } from "../../Constants";
import { RedisKey } from "../../utils/Redis";
import RedisService from "../thirdPartyService/RedisService";

const generateRTCToken = (title: string, uid: number): string => {
    return RtcTokenBuilder.buildTokenWithUid(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        title,
        uid,
        RtcRole.PUBLISHER,
        0,
    );
};

const generateRTMToken = (uid: string): string => {
    return RtmTokenBuilder.buildToken(
        Agora.APP_ID,
        Agora.APP_CERTIFICATE,
        uid,
        RtmRole.Rtm_User,
        0,
    );
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
