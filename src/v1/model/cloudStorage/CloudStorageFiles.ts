import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";

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
        length: 40,
        comment: "file name",
    })
    file_name: string;

    @Column({
        unsigned: true,
        type: "int",
        comment: "file size (bytes)",
    })
    file_size: number;
}
