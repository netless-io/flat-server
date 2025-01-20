import { RoomStatus, RoomType } from "./Constants";
import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { Region } from "../../constants/Project";

@Entity({
    name: "rooms",
})
export class RoomModel extends Content {
    @Index("rooms_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("rooms_periodic_uuid_index")
    @Column({
        length: 40,
        comment: "periodic uuid",
    })
    periodic_uuid: string;

    @Index("rooms_owner_uuid_index")
    @Column({
        length: 40,
    })
    owner_uuid: string;

    @Column({
        length: 150,
        comment: "room title",
    })
    title: string;

    @Index("rooms_room_type_index")
    @Column({
        type: "enum",
        enum: [RoomType.OneToOne, RoomType.BigClass, RoomType.SmallClass],
        comment: "room type",
    })
    room_type: RoomType;

    @Index("rooms_room_status_index")
    @Column({
        type: "enum",
        enum: [RoomStatus.Idle, RoomStatus.Started, RoomStatus.Paused, RoomStatus.Stopped],
        comment: "current room status",
    })
    room_status: RoomStatus;

    @Index("rooms_begin_time_index")
    @Column({
        type: "datetime",
        precision: 3,
        comment: "room begin time",
    })
    begin_time: Date;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "room end time",
    })
    end_time: Date;

    @Column({
        type: "enum",
        enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
    })
    region: Region;

    @Index("rooms_whiteboard_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    whiteboard_room_uuid: string;

    @Index("rooms_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;

    @Column({
        default: false,
    })
    has_record: boolean;
    
    @Column({
        default: false,
    })
    is_ai: boolean;
}
