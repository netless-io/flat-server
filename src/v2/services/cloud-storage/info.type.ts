import { FilePayload } from "../../../model/cloudStorage/Types";
import { FileResourceType } from "../../../model/cloudStorage/Constants";
import type { FilePayloadParse } from "./internal/utils/file-payload-parse";

export type CloudStorageInfoListParamsConfig = {
    order: "ASC" | "DESC";
    page: number;
    size: number;
    directoryPath: string;
};

export type CloudStorageInfoList = {
    fileUUID: string;
    fileName: string;
    fileSize: number;
    fileURL: string;
    createAt: Date;
    payload: FilePayload;
    resourceType: FileResourceType;
};

export type CloudStorageInfoListReturn = {
    fileUUID: string;
    fileName: string;
    fileSize: number;
    fileURL: string;
    createAt: number;
    resourceType: FileResourceType;
    meta: FilePayloadParse;
};

export type ListFilesAndTotalUsageByUserUUIDReturn = {
    totalUsage: number;
    files: CloudStorageInfoListReturn[];
    canCreateDirectory: boolean;
};

export type CloudStorageInfoFindFilesInfoReturn = Map<
    string,
    Omit<CloudStorageInfoFindFileInfoReturn, "fileUUID">
>;

export type FilesInfo = CloudStorageInfoFindFilesInfoReturn;

export type CloudStorageInfoFindFileInfoReturn = {
    fileUUID: string;
    directoryPath: string;
    fileName: string;
    fileSize: number;
    fileURL: string;
    resourceType: FileResourceType;
};
