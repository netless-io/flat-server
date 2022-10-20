import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { roomDAO } from "../../../dao";
import { addHours, addMinutes } from "date-fns/fp";
import { RoomStatus, RoomType } from "../../../../model/room/Constants";
import { Region } from "../../../../constants/Project";

export class CreateRoom {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        roomUUID: string;
        periodicUUID: string;
        ownerUUID: string;
        title: string;
        roomType: RoomType;
        roomStatus: RoomStatus;
        beginTime: Date;
        endTime: Date;
        whiteboardRoomUUID: string;
        region: Region;
    }) {
        await roomDAO.insert(this.t, {
            room_uuid: info.roomUUID,
            periodic_uuid: info.periodicUUID,
            owner_uuid: info.ownerUUID,
            title: info.title,
            room_type: info.roomType,
            room_status: info.roomStatus,
            begin_time: info.beginTime,
            end_time: info.endTime,
            whiteboard_room_uuid: info.whiteboardRoomUUID,
            region: info.region,
        });
        return info;
    }

    public async quick(
        info: {
            ownerUUID?: string;
            beginTime?: Date;
            endTime?: Date;
            roomUUID?: string;
            periodicUUID?: string;
            title?: string;
            roomType?: RoomType;
            roomStatus?: RoomStatus;
            whiteboardRoomUUID?: string;
            region?: Region;
        } = {},
    ) {
        const beginTime = info.beginTime || addHours(1)(Date.now());
        const roomInfo = {
            roomUUID: info.roomUUID || v4(),
            periodicUUID: info.periodicUUID || "",
            ownerUUID: info.ownerUUID || v4(),
            title: info.title || v4(),
            roomType: info.roomType || RoomType.OneToOne,
            roomStatus: info.roomStatus || RoomStatus.Stopped,
            beginTime,
            endTime: info.endTime || addMinutes(30)(beginTime),
            whiteboardRoomUUID: info.whiteboardRoomUUID || v4().replace("-", ""),
            region: info.region || Region.SG,
        };
        await this.full(roomInfo);
        return roomInfo;
    }
}
