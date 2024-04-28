import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "partner_rooms",
})
@Index("partner_rooms_partner_uuid_room_uuid_uindex", ["partner_uuid", "room_uuid"], {
    unique: true,
})
export class PartnerRoomModel extends Content {
    @Index("partner_rooms_partner_uuid_index")
    @Column({
        length: 40,
    })
    partner_uuid: string;

    @Index("partner_rooms_room_uuid_index")
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("partner_rooms_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
