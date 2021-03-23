import { CloudStorageConfigsDAO } from "../../../dao";
import { CloudStorage } from "../../../../Constants";

export const fileSizeTooBig = (currentFileSize: number): boolean => {
    return currentFileSize > CloudStorage.SINGLE_FILE_SIZE;
};

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
