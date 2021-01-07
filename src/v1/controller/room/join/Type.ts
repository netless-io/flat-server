import { RoomType } from "../Constants";

export type JoinResponse = {
    roomType: RoomType;
    roomUUID: string;
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    rtcUID: number;
    rtcToken: string;
    rtmToken: string;
};
