import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "room_periodic_users",
})
@Index("room_periodic_periodic_uuid_user_uuid_uindex", ["periodic_uuid", "user_uuid"], {
    unique: true,
})
export class RoomPeriodicUserModel extends Content {
    @Index("room_periodic_users_room_uuid_index")
    @Column({
        length: 40,
    })
    periodic_uuid: string;

    @Index("room_periodic_users_user_uuid_index")
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Index("room_periodic_users_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
