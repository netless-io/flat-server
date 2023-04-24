import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_sensitive",
})
export class UserSensitiveModel extends Content {
    @Index("user_sensitive_user_uuid_index")
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Index("user_sensitive_type_index")
    @Column({
        length: 128,
        comment: "sensitive type like 'phone'",
    })
    type: string;

    @Column({
        length: 2083,
        comment: "sensitive value like '123****4'",
    })
    content: string;

    @Index("user_sensitive_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
