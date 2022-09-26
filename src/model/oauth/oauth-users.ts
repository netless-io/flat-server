import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "oauth_users",
})
@Index("oauth_users_oauth_uuid_user_uuid_uindex", ["oauth_uuid", "user_uuid"], {
    unique: true,
})
export class OAuthUsersModel extends Content {
    @Index("oauth_users_oauth_uuid_index")
    @Column({
        length: 40,
    })
    oauth_uuid: string;

    @Index("oauth_users_user_uuid_index")
    @Column({
        length: 40,
        comment: "user id",
    })
    user_uuid: string;

    @Column({
        length: 300,
    })
    scopes: string;

    @Index("oauth_users_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
