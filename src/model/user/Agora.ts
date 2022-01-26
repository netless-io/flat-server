import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_agora",
})
export class UserAgoraModel extends Content {
    @Index("user_agora_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "agora nickname",
    })
    user_name: string;

    @Column({
        length: 32,
        comment: "agora id",
    })
    union_uuid: string;

    @Index("user_agora_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
