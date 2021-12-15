import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_apple",
})
export class UserAppleModel extends Content {
    @Index("user_apple_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "apple nickname",
    })
    user_name: string;

    @Column({
        length: 50,
        comment: "apple id",
    })
    union_uuid: string;

    @Index("user_apple_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
