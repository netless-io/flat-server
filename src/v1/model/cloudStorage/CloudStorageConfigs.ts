import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "cloud_storage_configs",
})
export class CloudStorageConfigsModel extends Content {
    @Index("cloud_storage_configs_user_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Column({
        unsigned: true,
        type: "bigint",
        default: 0,
        comment: "total cloud storage of a user (bytes)",
    })
    total_usage: string;

    @Index("cloud_storage_configs_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
