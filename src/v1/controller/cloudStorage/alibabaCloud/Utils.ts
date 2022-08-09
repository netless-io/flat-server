import { addMinutes } from "date-fns/fp";
import { StorageService } from "../../../../constants/Config";
import crypto from "crypto";
import OSS from "ali-oss";

export function getDisposition(fileName: string): string {
    const encodeFileName = encodeURIComponent(fileName);
    return `attachment; filename="${encodeFileName}"; filename*=UTF-8''${encodeFileName}`;
}

/**
 * alibaba cloud oss policy template
 * @param {string} fileName - file name to restrict download
 * @param {string} filePath - limit the file path that can only be uploaded
 * @param {number} fileSize - limit the size of uploaded file
 * @param {number} [expiration = 120] - expiration time(unit: minutes)
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/31988.htm}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/31978.html}
 */
export const policyTemplate = (
    fileName: string,
    filePath: string,
    fileSize: number,
    expiration = 60 * 2,
): {
    policy: string;
    signature: string;
} => {
    const policyString = JSON.stringify({
        expiration: addMinutes(expiration)(new Date()).toISOString(),
        conditions: [
            {
                bucket: StorageService.oss.bucket,
            },
            ["content-length-range", fileSize, fileSize],
            ["eq", "$key", filePath],
            ["eq", "$Content-Disposition", getDisposition(fileName)],
        ],
    });

    const policy = Buffer.from(policyString).toString("base64");
    const signature = crypto
        .createHmac("sha1", StorageService.oss.accessKeySecret)
        .update(policy)
        .digest("base64");

    return {
        policy,
        signature,
    };
};

export const ossClient = new OSS({
    bucket: StorageService.oss.bucket,
    region: StorageService.oss.region,
    endpoint: StorageService.oss.endpoint,
    accessKeyId: StorageService.oss.accessKey,
    accessKeySecret: StorageService.oss.accessKeySecret,
    secure: true,
});

/**
 * determine if an Object exists in the Bucket
 * fill in the full path of the Object without the Bucket name
 * @param {string} fullPath - file path
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/111392.htm}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/111392.html}
 */
export async function isExistObject(fullPath: string): Promise<boolean> {
    try {
        await ossClient.head(fullPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Delete a file in the bucket.
 */
export async function deleteObject(fullPath: string): Promise<boolean> {
    try {
        await ossClient.delete(fullPath);
        return true;
    } catch {
        return false;
    }
}
