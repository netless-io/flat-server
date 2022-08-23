import { FileResourceType } from "../../../model/cloudStorage/Constants";

export interface CloudStorageUploadStartConfig {
    fileName: string;
    fileSize: number;
    targetDirectoryPath: string;
}

export interface CloudStorageUploadStartReturn {
    fileUUID: string;
    ossDomain: string;
    ossFilePath: string;
    policy: string;
    signature: string;
}

export interface CloudStorageUploadFinishConfig {
    fileUUID: string;
}

export interface InsertFileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileUUID: string;
    directoryPath: string;
    fileResourceType: FileResourceType;
}

export interface GetFileInfoByRedisReturn {
    fileName: string;
    fileSize: number;
    targetDirectoryPath: string;
    fileResourceType: FileResourceType;
}
