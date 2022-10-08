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

    public async quick(info: { ownerUUID: string }) {
        const beginTime = addHours(1)(Date.now());
        const roomInfo = {
            roomUUID: v4(),
            periodicUUID: "",
            ownerUUID: info.ownerUUID,
            title: "test room",
            roomType: RoomType.OneToOne,
            roomStatus: RoomStatus.Stopped,
            beginTime: beginTime,
            endTime: addMinutes(30)(beginTime),
            whiteboardRoomUUID: v4().replace("-", ""),
            region: Region.SG,
        };
        await this.full(roomInfo);
        return roomInfo;
    }
}
