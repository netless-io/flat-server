import { RoomStatus } from "../../controller/room/Constants";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from "typeorm";

@Entity({
    name: "rooms",
})
export class RoomModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("rooms_room_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("rooms_cyclical_uuid_index")
    @Column({
        length: 40,
        comment: "cyclical uuid",
    })
    cyclical_uuid: string;

    @Index("rooms_creator_user_uuid_index")
    @Column({
        length: 40,
    })
    creator_user_uuid: string;

    @Column({
        length: 150,
        comment: "room title",
    })
    title: string;

    @Index("rooms_room_type_index")
    @Column({
        type: "tinyint",
        comment: "room type(one to one: 0 / small class: 1 / big class: 2",
    })
    room_type: number;

    @Index("rooms_room_status_index")
    @Column({
        type: "enum",
        enum: [RoomStatus.Pending, RoomStatus.Running, RoomStatus.Stopped],
        comment: "current room status",
    })
    room_status: RoomStatus;

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

    @CreateDateColumn({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    created_at: Date;

    @UpdateDateColumn({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    updated_at: Date;

    @VersionColumn()
    version: number;

    @Column({
        default: false,
    })
    is_delete: boolean;
}
