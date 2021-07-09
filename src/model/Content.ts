import { Column, PrimaryGeneratedColumn, VersionColumn } from "typeorm";

export abstract class Content {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

    @Column({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    created_at: Date;

    @Column({
        type: "datetime",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
        onUpdate: "CURRENT_TIMESTAMP(3)",
    })
    updated_at: Date;

    @VersionColumn()
    version: number;
}
