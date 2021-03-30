import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

@Entity({
    name: "cloud_storage_user_files",
})
@Index("cloud_storage_user_files_file_uuid_user_uuid_uindex", ["file_uuid", "user_uuid"], {
    unique: true,
})
export class CloudStorageUserFilesModel extends Content {
    @Index("cloud_storage_user_files_file_uuid_index")
    @Column({
        length: 40,
    })
    file_uuid: string;

    @Index("cloud_storage_user_files_user_uuid_index")
    @Column({
        length: 40,
    })
    user_uuid: string;

    @Index("cloud_storage_user_files_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
