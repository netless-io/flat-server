import { FileResourceType } from "../../../model/cloudStorage/Constants";

export type FilesInfoBasic = {
    resourceType: FileResourceType;
    fileName: string;
    directoryPath: string;
    fileUUID: string;
};
