import { RoomType } from "../../../../model/room/Constants";

export type ResponseType = {
    roomType: RoomType;
    roomUUID: string;
    ownerUUID: string;
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    rtcUID: number;
    rtcToken: string;
    rtmToken: string;
};
