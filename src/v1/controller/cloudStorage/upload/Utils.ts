import { CloudStorageConfigsDAO } from "../../../dao";

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
        // total_usage size limit to 2GB
        fail: totalUsage > 1024 * 1024 * 1024 * 2,
        totalUsage,
    };
};
