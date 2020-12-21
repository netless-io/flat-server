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
    name: "room_docs",
})
export class RoomDocModel {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Index("room_docs_room_uuid_index")
    @Column({
        length: 40,
    })
    room_uuid: string;

    @Index("room_docs_cyclical_uuid_index")
    @Column({
        length: 40,
    })
    cyclical_uuid: string;

    @Index("room_docs_doc_uuid_index")
    @Column({
        length: 40,
    })
    doc_uuid: string;

    @Column({
        type: "enum",
        enum: ["Dynamic", "Static"],
    })
    doc_type: string;

    @Index("room_doc_is_preload_index")
    @Column()
    is_preload: boolean;

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
