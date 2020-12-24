import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "room_cyclical",
})
export class RoomCyclicalModel extends Content {
    @Column({
        length: 40,
    })
    cyclical_uuid: string;

    @Index("room_cyclical_fake_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    fake_room_uuid: string;

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

    @Index("room_cyclical_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
