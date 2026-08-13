import { randomUUID } from "crypto";
import { getRTCToken, getRTMToken } from "../v1/utils/AgoraToken";
import { agoraCloudRecordAcquireRequest } from "../v1/utils/request/agora/Agora";
import {
    whiteboardBanRoom,
    whiteboardCreateRoom,
} from "../v1/utils/request/whiteboard/WhiteboardRequest";
import { ClassroomResourceProfile } from "./Registry";

export type ClassroomResourceActiveHealth = {
    tokenSigning: "ok";
    whiteboard: "ok";
    agoraCloudRecording?: "ok";
};

// This probe deliberately uses the exact credentials and request helpers used
// by classrooms. A structural config comparison alone cannot detect revoked or
// expired provider credentials.
export async function probeClassroomResourceProfile(
    profile: ClassroomResourceProfile,
): Promise<ClassroomResourceActiveHealth> {
    const suffix = randomUUID().replace(/-/g, "");
    const roomUUID = `openflat-health-${suffix}`;
    const userUUID = `health-${suffix}`;
    const rtcUID = Number(suffix.slice(0, 6).replace(/^0+/, "") || "1");

    const rtmToken = await getRTMToken(userUUID, profile);
    if (!rtmToken) {
        throw new Error(`Agora RTM token signing failed for profile: ${profile.key}`);
    }

    if (profile.rtcProvider === "agora") {
        const rtcToken = await getRTCToken(roomUUID, rtcUID, profile);
        if (!rtcToken) {
            throw new Error(`Agora RTC token signing failed for profile: ${profile.key}`);
        }
        const acquired = await agoraCloudRecordAcquireRequest(
            {
                cname: roomUUID,
                uid: String(rtcUID),
                clientRequest: { resourceExpiredHour: 1, scene: 0 },
            },
            profile,
        );
        if (!acquired.resourceId) {
            throw new Error(`Agora cloud recording probe failed for profile: ${profile.key}`);
        }
    }

    const whiteboardRoomUUID = await whiteboardCreateRoom(profile.whiteboard.region, profile, 1);
    if (!whiteboardRoomUUID) {
        throw new Error(`Whiteboard probe failed for profile: ${profile.key}`);
    }
    await whiteboardBanRoom(profile.whiteboard.region, whiteboardRoomUUID, profile);

    return {
        tokenSigning: "ok",
        whiteboard: "ok",
        ...(profile.rtcProvider === "agora" ? { agoraCloudRecording: "ok" as const } : {}),
    };
}
