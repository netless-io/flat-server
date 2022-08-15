import OSS from "ali-oss";
import { StorageService } from "../../../constants/Config";

export const aliOSSClient = new OSS({
    bucket: StorageService.oss.bucket,
    region: StorageService.oss.region,
    endpoint: StorageService.oss.endpoint,
    accessKeyId: StorageService.oss.accessKey,
    accessKeySecret: StorageService.oss.accessKeySecret,
    secure: true,
});
