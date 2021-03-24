import { addMinutes } from "date-fns/fp";
import { AlibabaCloud, CloudStorage } from "../../../../../Constants";
import crypto from "crypto";
import path from "path";

/**
 * alibaba cloud oss policy template
 * @param {string} filePath - limit the file path that can only be uploaded
 * @param {number} fileSize - limit the size of uploaded file
 * @param {number} [expiration = 120] - expiration time(unit: minutes)
 * @link https://www.alibabacloud.com/help/doc-detail/31988.htm?spm=a2c63.p38356.b99.1062.4aad372caCcaoQ
 * @link https://help.aliyun.com/document_detail/31978.html?spm=a2c4g.11186623.6.1690.2d51abefIf0dn3
 * @see [English Document]{@link https://www.alibabacloud.com/help/doc-detail/31988.htm?spm=a2c63.p38356.b99.1062.4aad372caCcaoQ}
 * @see [Chinese Document]{@link https://help.aliyun.com/document_detail/31978.html?spm=a2c4g.11186623.6.1690.2d51abefIf0dn3}
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
            ["content-length-range", 0, fileSize],
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
