import { RoomType } from "../../../../model/room/Constants";
import { Region } from "../../../../constants/Project";

export type ResponseType = {
    roomType: RoomType;
    roomUUID: string;
    ownerUUID: string;
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    rtcUID: number;
    rtcToken: string;
    rtcShareScreen: {
        uid: 10;
        token: string;
    };
    rtmToken: string;
    region: Region;
    showGuide: boolean;
    participant: {
        userUUID: string;
        name: string;
        avatarURL: string;
    };
    classroomResource: {
        profileKey: string;
        rtcProvider: "agora" | "openflat_rtc";
        rtmProvider: "agora";
        recordingProvider: "agora" | "openflat_rtc";
        agoraAppID: string;
        whiteboardAppID: string;
        whiteboardRegion: Region;
    };
};
