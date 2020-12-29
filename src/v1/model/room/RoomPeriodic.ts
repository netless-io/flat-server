import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { RoomStatus } from "../../controller/room/Constants";

@Entity({
    name: "room_periodic",
})
export class RoomPeriodicModel extends Content {
    @Column({
        length: 40,
    })
    periodic_uuid: string;

    @Index("room_periodic_fake_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    fake_room_uuid: string;

    @Index("room_periodic_room_type_index")
    @Column({
        type: "tinyint",
        comment: "room type(one to one: 0 / small class: 1 / big class: 2",
    })
    room_type: number;

    @Index("room_periodic_begin_time_index")
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

    @Index("room_periodic_room_status_index")
    @Column({
        type: "enum",
        enum: [RoomStatus.Pending, RoomStatus.Running, RoomStatus.Stopped],
        comment: "current room status",
    })
    room_status: RoomStatus;

    @Index("room_periodic_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
