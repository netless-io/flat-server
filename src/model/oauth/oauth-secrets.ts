import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "oauth_secrets",
})
@Index("oauth_secrets_client_id_client_secret_uindex", ["client_id", "client_secret"], {
    unique: true,
})
export class OAuthSecretsModel extends Content {
    @Index("oauth_secrets_oauth_uuid_index")
    @Column({
        length: 40,
    })
    oauth_uuid: string;

    @Index("oauth_secrets_secret_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    secret_uuid: string;

    @Index("oauth_secrets_client_id_index")
    @Column({
        length: 40,
        comment: "application client id",
    })
    client_id: string;

    @Index("oauth_secrets_client_secret_index")
    @Column({
        length: 40,
        comment: "application client secret",
    })
    client_secret: string;

    @Index("oauth_secrets_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
