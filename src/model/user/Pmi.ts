import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_pmi",
})
export class UserPmiModel extends Content {
    @Index("user_pmi_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Index("user_pmi_pmi_uindex", {
        unique: true,
    })
    @Column({
        length: 20,
    })
    pmi: string;

    @Index("user_pmi_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
