import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { FileConvertStep } from "../../controller/cloudStorage/Constants";

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
        comment: "file url in oss cdn",
    })
    file_url: string;

    @Column({
        type: "json",
        comment: "file convert result info",
    })
    convert_result: string[];

    @Column({
        type: "enum",
        enum: [
            FileConvertStep.Pending,
            FileConvertStep.Converting,
            FileConvertStep.Done,
            FileConvertStep.Failed,
        ],
        default: FileConvertStep.Pending,
    })
    convert_step: FileConvertStep;

    @Column({
        length: 40,
        comment: "netless conversion task uuid v1",
    })
    task_uuid: string;

    @Column({
        length: 256,
        comment: "generated from sdk token and task uuid",
    })
    task_token: string;

    @Index("cloud_storage_files_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
