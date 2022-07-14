import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { CloudStorageFilesModel } from "../../../../model/cloudStorage/CloudStorageFiles";
import { FilePayload } from "../../../../model/cloudStorage/Types";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import { Region } from "../../../../constants/Project";

const infoByType = (resourceType: FileResourceType) => {
    let payload = {};
    switch (resourceType) {
        case FileResourceType.NormalResources: {
            payload = { region: Region.IN_MUM };
            break;
        }
        case FileResourceType.LocalCourseware: {
            payload = { region: Region.CN_HZ, convertStep: FileConvertStep.Converting };
            break;
        }
        case FileResourceType.Directory:
        case FileResourceType.OnlineCourseware: {
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
        directoryName: v4(),
        resourceType,
    };
};

export class CreateCloudStorageFiles {
    public static async full(info: {
        fileUUID: string;
        fileName: string;
        fileSize: number;
        fileURL: string;
        directoryName: string;
        payload: FilePayload;
        resourceType: FileResourceType;
    }) {
        await dataSource.getRepository(CloudStorageFilesModel).insert({
            file_uuid: info.fileUUID,
            file_name: info.fileName,
            file_size: info.fileSize,
            file_url: info.fileURL,
            directory_name: info.directoryName,
            payload: info.payload,
            resource_type: info.resourceType,
        });
    }

    public static async quick(resourceType: FileResourceType) {
        const info = infoByType(resourceType);
        await CreateCloudStorageFiles.full(info);

        return info;
    }

    public static async fixedDirectoryName(directoryName: string) {
        const info = {
            ...infoByType(FileResourceType.Directory),
            directoryName,
            fileName: ".keep",
        };
        await CreateCloudStorageFiles.full(info);

        return info;
    }
}
