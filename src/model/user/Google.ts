import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_google",
})
export class UserGoogleModel extends Content {
    @Index("user_google_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "google nickname",
    })
    user_name: string;

    @Column({
        length: 32,
        comment: "google id",
    })
    union_uuid: string;

    @Index("user_google_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
