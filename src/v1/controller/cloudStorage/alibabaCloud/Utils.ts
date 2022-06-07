import { addMinutes } from "date-fns/fp";
import { StorageService } from "../../../../constants/Config";
import crypto from "crypto";
import OSS from "ali-oss";
import { Region } from "../../../../constants/Project";

export function getDisposition(fileName: string): string {
    const encodeFileName = encodeURIComponent(fileName);
    return `attachment; filename="${encodeFileName}"; filename*=UTF-8''${encodeFileName}`;
}

/**
 * alibaba cloud oss policy template
 * @param {string} fileName - file name to restrict download
 * @param {string} filePath - limit the file path that can only be uploaded
 * @param {number} fileSize - limit the size of uploaded file
 * @param {Region} region - file region
 * @param {number} [expiration = 120] - expiration time(unit: minutes)
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/31988.htm}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/31978.html}
 */
export const policyTemplate = (
    fileName: string,
    filePath: string,
    fileSize: number,
    region: Region,
    expiration = 60 * 2,
): {
    policy: string;
    signature: string;
} => {
    const policyString = JSON.stringify({
        expiration: addMinutes(expiration)(new Date()).toISOString(),
        conditions: [
            {
                bucket: StorageService.oss[region].bucket,
            },
            ["content-length-range", fileSize, fileSize],
            ["eq", "$key", filePath],
            ["eq", "$Content-Disposition", getDisposition(fileName)],
        ],
    });

    const policy = Buffer.from(policyString).toString("base64");
    const signature = crypto
        .createHmac("sha1", StorageService.oss[region].accessKeySecret)
        .update(policy)
        .digest("base64");

    return {
        policy,
        signature,
    };
};

const createOSSClient = (region: Region): OSS => {
    return new OSS({
        bucket: StorageService.oss[region].bucket,
        region: StorageService.oss[region].region,
        endpoint: StorageService.oss[region].endpoint,
        accessKeyId: StorageService.oss[region].accessKey,
        accessKeySecret: StorageService.oss[region].accessKeySecret,
        secure: true,
    });
};

export const ossClient = {
    [Region.CN_HZ]: createOSSClient(Region.CN_HZ),
    [Region.US_SV]: createOSSClient(Region.US_SV),
    [Region.SG]: createOSSClient(Region.SG),
    [Region.IN_MUM]: createOSSClient(Region.IN_MUM),
    [Region.GB_LON]: createOSSClient(Region.GB_LON),
};

/**
 * determine if an Object exists in the Bucket
 * fill in the full path of the Object without the Bucket name
 * @param {string} fullPath - file path
 * @param {Region} region - file region
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/111392.htm}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/111392.html}
 */
export async function isExistObject(fullPath: string, region: Region): Promise<boolean> {
    try {
        await ossClient[region].head(fullPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Delete a file in the bucket.
 */
export async function deleteObject(fullPath: string, region: Region): Promise<boolean> {
    try {
        await ossClient[region].delete(fullPath);
        return true;
    } catch {
        return false;
    }
}
