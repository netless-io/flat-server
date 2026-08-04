import { RtcRole, RtcTokenBuilder, RtmRole, RtmTokenBuilder } from "agora-access-token";
import { ClassroomResourceProfile, getDefaultClassroomResourceProfile } from "../../classroomResource/Registry";
import { RedisKey } from "../../utils/Redis";
import RedisService from "../../thirdPartyService/RedisService";

const generateRTCToken = (title: string, uid: number, profile: ClassroomResourceProfile): string => {
    return RtcTokenBuilder.buildTokenWithUid(
        profile.agora.appId,
        profile.agora.certificate,
        title,
        uid,
        RtcRole.PUBLISHER,
        Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    );
};

const generateRTMToken = (uid: string, profile: ClassroomResourceProfile): string => {
    return RtmTokenBuilder.buildToken(profile.agora.appId, profile.agora.certificate, uid, RtmRole.Rtm_User, 0);
};

export const getRTCToken = async (roomUUID: string, rtcUID: number, profile = getDefaultClassroomResourceProfile()): Promise<string> => {
    const rtcKey = RedisKey.agoraRTCRoomUserToken(`${profile.key}:${roomUUID}`, rtcUID);
    let rtcToken = await RedisService.get(rtcKey);

    if (rtcToken === null) {
        rtcToken = generateRTCToken(roomUUID, rtcUID, profile);
        // 23 hour 59 minute
        await RedisService.set(rtcKey, rtcToken, 60 * 60 * 24 - 60);
    }

    return rtcToken;
};

export const getRTMToken = async (userUUID: string, profile = getDefaultClassroomResourceProfile()): Promise<string> => {
    const rtmKey = RedisKey.agoraRTMUserToken(`${profile.key}:${userUUID}`);
    let rtmToken = await RedisService.get(rtmKey);

    if (rtmToken === null) {
        rtmToken = generateRTMToken(userUUID, profile);
        await RedisService.set(rtmKey, rtmToken, 60 * 60 * 24 - 60);
    }

    return rtmToken;
};
