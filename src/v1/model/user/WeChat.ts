import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from "typeorm";

@Entity({
    name: "user_wechat",
})
export class UserWeChatModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("users_wechat_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        length: 40,
        comment: "wechat nickname",
    })
    user_name: string;

    @Column({
        length: 40,
        comment: "wechat open id",
    })
    open_uuid: string;

    @Column({
        length: 40,
        comment: "wechat union id",
    })
    union_uuid: string;

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
