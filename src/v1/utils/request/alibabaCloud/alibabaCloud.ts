import OSS, { STS, Credentials } from "ali-oss";

export const ossClient = new OSS({
    bucket: process.env.ALIBABA_CLOUD_OSS_BUCKET,
    region: process.env.ALIBABA_CLOUD_OSS_REGION,
    accessKeyId: process.env.ALIBABA_CLOUD_OSS_ACCESS_KEY,
    accessKeySecret: process.env.ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET,
});

const sts = new STS({
    accessKeyId: process.env.ALIBABA_CLOUD_OSS_ACCESS_KEY,
    accessKeySecret: process.env.ALIBABA_CLOUD_OSS_ACCESS_KEY_SECRET,
});

// https://www.alibabacloud.com/help/zh/doc-detail/32077.htm?spm=a2c63.p38356.879954.20.24667727cDnb0Y#section-zkq-3rq-dhb
export const alibabaCloudGetSTSToken = async (): Promise<Credentials> => {
    const { credentials } = await sts.assumeRole(
        process.env.ALIBABA_CLOUD_OSS_ROLE_ARN, // role arn
        undefined,
        15 * 60, // expiration
        process.env.ALIBABA_CLOUD_OSS_SESSION_NAME, // session name
    );
    return credentials;
};
