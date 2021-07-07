import { Column, Entity, Index } from "typeorm";
import { Content } from "../Content";
import { FileConvertStep } from "./Constants";
import { Region } from "../../constants/Project";

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
        type: "enum",
        enum: [
            FileConvertStep.None,
            FileConvertStep.Converting,
            FileConvertStep.Done,
            FileConvertStep.Failed,
        ],
        default: FileConvertStep.None,
    })
    convert_step: FileConvertStep;

    @Column({
        length: 40,
        comment: "netless conversion task uuid v1",
        default: "",
    })
    task_uuid: string;

    @Column({
        length: 256,
        comment: "generated from sdk token and task uuid",
        default: "",
    })
    task_token: string;

    @Column({
        type: "enum",
        enum: [Region.CN_HZ, Region.US_SV, Region.SG, Region.IN_MUM, Region.GB_LON],
    })
    region: Region;

    @Index("cloud_storage_files_is_delete_index")
    @Column({
        default: false,
    })
    is_delete: boolean;
}
