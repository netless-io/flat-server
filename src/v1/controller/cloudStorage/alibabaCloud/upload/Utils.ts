import { CloudStorageConfigsDAO } from "../../../../../dao";
import { AlibabaCloud, CloudStorage } from "../../../../../constants/Process";
import path from "path";
import { Region } from "../../../../../constants/Project";

export const checkTotalUsage = async (
    userUUID: string,
    currentFileSize: number,
): Promise<{
    fail: boolean;
    totalUsage: number;
}> => {
    const cloudStorageConfigInfo = await CloudStorageConfigsDAO().findOne(["total_usage"], {
        user_uuid: userUUID,
    });

    const totalUsage = (Number(cloudStorageConfigInfo?.total_usage) || 0) + currentFileSize;

    return {
        fail: totalUsage > CloudStorage.TOTAL_SIZE,
        totalUsage,
    };
};

export const getFilePath = (fileName: string, fileUUID: string): string => {
    return `${CloudStorage.PREFIX_PATH}/${fileUUID}${path.extname(fileName)}`;
};

export const getOSSDomain = (region: Region): string => {
    return `https://${AlibabaCloud[region].OSS_BUCKET}.${AlibabaCloud.OSS_ENDPOINT}`;
};

export const getOSSFileURLPath = (filePath: string, region: Region): string => {
    return `${getOSSDomain(region)}/${filePath}`;
};
