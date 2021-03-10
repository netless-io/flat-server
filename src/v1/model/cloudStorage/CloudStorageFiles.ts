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
        comment: "oss cdn url",
    })
    file_url: string;

    @Column({
        type: "json",
        comment: "convert result",
    })
    file_urls: string;

    @Index("is_converted")
    @Column({
        type: "boolean",
        default: false,
    })
    is_converted: boolean;

    @Column({
        length: 40,
    })
    task_uuid: string;

    @Column({
        length: 256,
    })
    task_token: string;
}
