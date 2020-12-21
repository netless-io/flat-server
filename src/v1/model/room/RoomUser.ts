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
    name: "room_users",
})
export class RoomUserModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("room_users_room_uuid_index")
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("room_users_user_uuid_index")
    @Column({
        length: 40,
    })
    user_uuid: string;

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
