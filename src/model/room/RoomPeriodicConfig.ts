import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { PeriodicStatus, RoomType } from "./Constants";
import { Region } from "../../constants/Project";

@Entity({
    name: "room_periodic_configs",
})
export class RoomPeriodicConfigModel extends Content {
    @Index("periodic_configs_periodic_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    periodic_uuid: string;

    @Index("periodic_configs_owner_uuid_index")
    @Column({
        length: 40,
    })
    owner_uuid: string;

    @Column({
        length: 150,
        comment: "room title",
    })
    title: string;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "room origin begin time",
    })
    room_origin_begin_time: Date;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "room origin end time",
    })
    room_origin_end_time: Date;

    @Column({
        length: 13,
        comment: "periodic week",
    })
    weeks: string;

    @Column({
        type: "tinyint",
        precision: 3,
        comment: "periodic rate (max 50)",
    })
    rate: number;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "periodic end time",
    })
    end_time: Date;

    @Index("room_periodic_configs_type_index")
    @Column({
        type: "enum",
        enum: [RoomType.OneToOne, RoomType.BigClass, RoomType.SmallClass],
        comment: "room type",
    })
    room_type: RoomType;

    @Index("rooms_periodic_status_index")
    @Column({
        type: "enum",
        enum: [PeriodicStatus.Idle, PeriodicStatus.Started, PeriodicStatus.Stopped],
        comment: "current periodic status",
    })
    periodic_status: PeriodicStatus;

    @Column({
        type: "enum",
        enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
    })
    region: Region;

    @Index("periodic_configs_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
