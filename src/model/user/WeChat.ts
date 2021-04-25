import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_wechat",
})
export class UserWeChatModel extends Content {
    @Index("user_wechat_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "wechat nickname",
    })
    user_name: string;

    @Column({
        length: 40,
        comment: "wechat open id",
    })
    open_uuid: string;

    @Column({
        length: 40,
        comment: "wechat union id",
    })
    union_uuid: string;

    @Index("user_wechat_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
