import { CloudStorageConfigsDAO } from "../../../../dao";
import { ossClient } from "../../../../utils/request/alibabaCloud/alibabaCloud";

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

// Determine if an Object exists in the Bucket
// Fill in the full path of the Object without the Bucket name
// https://www.alibabacloud.com/help/doc-detail/111392.htm
export async function getOSSFileSize(fullPath: string): Promise<number> {
    try {
        const fileInfo = await ossClient.head(fullPath);
        return Number((fileInfo.res.headers as any)["content-length"]);
    } catch {
        return NaN;
    }
}
