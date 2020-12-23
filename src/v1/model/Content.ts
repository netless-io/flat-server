import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export abstract class Content {
    @PrimaryGeneratedColumn({
        type: "bigint",
    })
    id: number;

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
}
