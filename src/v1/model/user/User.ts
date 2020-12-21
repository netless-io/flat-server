import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from "typeorm";
import { LoginPlatform } from "../../controller/login/Constants";

@Entity({
    name: "users",
})
export class UserModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("users_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 50,
    })
    user_name: string;

    @Column({
        precision: 32,
    })
    user_password: string;

    @Column({
        length: 2083,
    })
    avatar_url: string;

    @Column({
        length: 20,
    })
    phone: string;

    @Column({
        type: "tinyint",
        comment: "1: man / 2: woman",
    })
    sex: number;

    @Column({
        type: "enum",
        enum: [LoginPlatform.WeChat, LoginPlatform.Google],
    })
    last_login_platform: LoginPlatform;

    @CreateDateColumn({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    created_at: Date;

    @UpdateDateColumn({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    updated_at: Date;

    @VersionColumn()
    version: number;

    @Column({
        default: false,
    })
    is_delete: boolean;
}
