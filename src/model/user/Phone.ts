import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "user_phone",
})
export class UserPhoneModel extends Content {
    @Index("user_phone_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "phone nickname",
    })
    user_name: string;

    @Index("user_phone_phone_number_uindex", {
        unique: true,
    })
    @Column({
        length: 50,
        comment: "phone number",
    })
    phone_number: string;

    @Index("user_phone_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
