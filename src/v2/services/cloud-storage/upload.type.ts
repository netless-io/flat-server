import { FileResourceType } from "../../../model/cloudStorage/Constants";

export interface CloudStorageUploadStartConfig {
    fileName: string;
    fileSize: number;
    targetDirectoryPath: string;
    convertType?: FileResourceType;
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

export interface TempPhotoUploadStartConfig {
    fileName: string;
    fileSize: number;
}

export interface TempPhotoUploadStartReturn {
    fileUUID: string;
    ossDomain: string;
    ossFilePath: string;
    policy: string;
    signature: string;
}

export interface TempPhotoUploadFinishConfig {
    fileUUID: string;
}
