import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_email",
})
export class UserEmailModel extends Content {
    @Index("user_email_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Index("user_email_user_email_uindex", {
        unique: true,
    })
    @Column({
        length: 100,
        comment: "email address",
    })
    user_email: string;

    @Index("user_email_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
