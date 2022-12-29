import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_qq",
})
export class UserQQModel extends Content {
    @Index("user_qq_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "qq nickname",
    })
    user_name: string;

    @Column({
        length: 40,
        comment: "qq open id",
    })
    open_uuid: string;

    @Column({
        length: 40,
        comment: "qq union id",
    })
    union_uuid: string;

    @Index("user_qq_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
