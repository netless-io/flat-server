import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "partners",
})
export class PartnerModel extends Content {
    @Index("partners_partner_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    partner_uuid: string;

    @Column({
        length: 2083,
        comment: "meta data",
    })
    content: string;

    @Index("partners_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
