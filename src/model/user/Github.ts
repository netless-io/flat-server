import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_github",
})
export class UserGithubModel extends Content {
    @Index("user_github_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "github nickname",
    })
    user_name: string;

    @Column({
        length: 32,
        comment: "github id",
    })
    union_uuid: string;

    @Column({
        length: 255,
        comment: "[deprecated]: github access token",
        default: "",
    })
    access_token: string;

    @Index("user_github_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
