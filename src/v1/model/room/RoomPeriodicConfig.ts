import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { RoomStatus } from "../../controller/room/Constants";

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

    @Index("periodic_configs_owner_user_uuid_index")
    @Column({
        length: 40,
    })
    owner_user_uuid: string;

    @Column({
        length: 150,
        comment: "room title",
    })
    title: string;

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

    @Index("rooms_periodic_status_index")
    @Column({
        type: "enum",
        enum: [RoomStatus.Pending, RoomStatus.Running, RoomStatus.Stopped],
        comment: "current room status",
    })
    periodic_status: RoomStatus;

    @Index("periodic_configs_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
