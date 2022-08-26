import { v4 } from "uuid";
import { FilePayload } from "../../../../model/cloudStorage/Types";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import { Region } from "../../../../constants/Project";
import { EntityManager } from "typeorm";
import { cloudStorageFilesDAO } from "../../../dao";

export const infoByType = (resourceType: FileResourceType) => {
    let payload: FilePayload = {};
    switch (resourceType) {
        case FileResourceType.NormalResources: {
            payload = {};
            break;
        }
        case FileResourceType.Directory: {
            payload = {};
            break;
        }
        case FileResourceType.WhiteboardConvert: {
            payload = {
                region: Region.GB_LON,
                convertStep: FileConvertStep.Done,
                taskUUID: v4(),
                taskToken: v4(),
            };
            break;
        }
        case FileResourceType.WhiteboardProjector: {
            payload = {
                region: Region.US_SV,
                convertStep: FileConvertStep.None,
                taskUUID: v4(),
                taskToken: v4(),
            };
            break;
        }
    }

    return {
        fileUUID: v4(),
        fileName: v4(),
        fileSize: Math.ceil(Math.random() * 1000),
        fileURL: `https://${v4()}.com`,
        payload,
        directoryPath: "/",
        resourceType,
    };
};

export class CreateCloudStorageFiles {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        fileUUID: string;
        fileName: string;
        fileSize: number;
        fileURL: string;
        directoryPath: string;
        payload: FilePayload;
        resourceType: FileResourceType;
    }) {
        await cloudStorageFilesDAO.insert(this.t, {
            file_uuid: info.fileUUID,
            file_name: info.fileName,
            file_size: info.fileSize,
            file_url: info.fileURL,
            directory_path: info.directoryPath,
            payload: info.payload,
            resource_type: info.resourceType,
        });

        return info;
    }

    public async quick(resourceType: FileResourceType) {
        const info = infoByType(resourceType);
        await this.full(info);

        return info;
    }

    public async createDirectory(parentDirectoryPath: string, directoryName: string) {
        const info = {
            ...infoByType(FileResourceType.Directory),
            directoryPath: parentDirectoryPath,
            fileName: directoryName,
            fileSize: 0,
        };
        await this.full(info);

        return info;
    }

    public async fixedDirectoryPath(directoryPath: string, fileName: string) {
        const arr = [
            FileResourceType.WhiteboardProjector,
            FileResourceType.WhiteboardConvert,
            FileResourceType.NormalResources,
        ];
        const rand = Math.floor(Math.random() * arr.length);

        const info = {
            ...infoByType(arr[rand]),
            directoryPath,
            fileName,
        };
        await this.full(info);

        return info;
    }
}
