import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "room_users",
})
@Index("room_users_room_uuid_user_uuid_uindex", ["room_uuid", "user_uuid"], {
    unique: true,
})
@Index("room_users_room_uuid_user_int_uuid_uindex", ["room_uuid", "user_int_uuid"], {
    unique: true,
})
export class RoomUserModel extends Content {
    @Index("room_users_room_uuid_index")
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("room_users_user_uuid_index")
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 10,
        comment: "front-end needs this field to set whiteboard, rtc, rtm",
    })
    user_int_uuid: string;

    @Index("room_users_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
