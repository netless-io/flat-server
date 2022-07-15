import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { FileResourceType } from "./Constants";
import { FilePayload } from "./Types";

@Entity({
    name: "cloud_storage_files",
})
export class CloudStorageFilesModel extends Content {
    @Index("cloud_storage_files_file_uuid_uindex", {
        unique: true,
    })
    @Column({
        length: 40,
    })
    file_uuid: string;

    @Column({
        length: 128,
        comment: "file name",
    })
    file_name: string;

    @Column({
        unsigned: true,
        type: "int",
        comment: "file size (bytes)",
    })
    file_size: number;

    @Column({
        length: 256,
        comment: "file url",
    })
    file_url: string;

    @Column({
        length: 300,
        comment: "directory path",
        default: "/",
    })
    directory_path: string;

    @Column({
        type: "json",
        default: () => "('{}')",
    })
    payload: FilePayload;

    @Index("cloud_storage_files_resource_type_index")
    @Column({
        length: 20,
        type: "varchar",
    })
    resource_type: FileResourceType;

    @Index("cloud_storage_files_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
