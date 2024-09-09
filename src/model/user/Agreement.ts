import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_agreement",
})
export class UserAgreementModel extends Content {
    @Index("user_agreement_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        default: false,
    })
    is_agree_collect_data: boolean;

    @Index("user_agreement_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
