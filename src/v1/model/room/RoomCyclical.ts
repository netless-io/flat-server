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
    name: "room_cyclical",
})
export class RoomCyclicalModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("room_cyclical_cyclical_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    cyclical_uuid: string;

    @Index("room_cyclical_creator_user_uuid_index")
    @Column({
        length: 40,
    })
    creator_user_uuid: string;

    @Column({
        type: "tinyint",
        precision: 3,
        comment: "cyclical rate (max 50)",
    })
    rate: number;

    @Column({
        type: "datetime",
        precision: 3,
        comment: "cyclical end time",
    })
    end_time: Date;

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

    @Index("room_cyclical_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
