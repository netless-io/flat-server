import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "room_cyclical_configs",
})
export class RoomCyclicalConfigModel extends Content {
    @Index("cyclical_configs_cyclical_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    cyclical_uuid: string;

    @Index("cyclical_configs_creator_user_uuid_index")
    @Column({
        length: 40,
    })
    creator_user_uuid: string;

    @Column({
        type: "tinyint",
        precision: 3,
        comment: "cyclical rate (max 50)",
    })
    rate: number;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "cyclical end time",
    })
    end_time: Date;

    @Index("cyclical_configs_current_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
        comment: "room_uuid of the current periodic room",
    })
    current_room_uuid: string;

    @Index("cyclical_configs_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
