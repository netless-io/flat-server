import { addMinutes } from "date-fns/fp";
import { AlibabaCloud, CloudStorage } from "../../../../../Constants";
import crypto from "crypto";
import path from "path";
import OSS from "ali-oss";

/**
 * alibaba cloud oss policy template
 * @param {string} filePath - limit the file path that can only be uploaded
 * @param {number} fileSize - limit the size of uploaded file
 * @param {number} [expiration = 120] - expiration time(unit: minutes)
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/31988.htm}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/31978.html}
 */
export const policyTemplate = (
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
                bucket: AlibabaCloud.OSS_BUCKET,
            },
            ["content-length-range", fileSize, fileSize],
            ["eq", "$key", filePath],
        ],
    });

    const policy = Buffer.from(policyString).toString("base64");
    const signature = crypto
        .createHmac("sha1", AlibabaCloud.OSS_ACCESS_KEY_SECRET)
        .update(policy)
        .digest("base64");

    return {
        policy,
        signature,
    };
};

export const getFilePath = (fileName: string, fileUUID: string): string => {
    return `${CloudStorage.PREFIX_PATH}/${fileUUID}${path.extname(fileName)}`;
};

export const getOSSFileURLPath = (filePath: string): string => {
    return `https://${AlibabaCloud.OSS_BUCKET}.${AlibabaCloud.OSS_REGION}.aliyuncs.com/${filePath}`;
};

export const ossClient = new OSS({
    bucket: AlibabaCloud.OSS_BUCKET,
    region: AlibabaCloud.OSS_REGION,
    accessKeyId: AlibabaCloud.OSS_ACCESS_KEY,
    accessKeySecret: AlibabaCloud.OSS_ACCESS_KEY_SECRET,
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
