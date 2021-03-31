import { FastifyRoutes } from "../../types/Server";
import { fileConvertStart, fileConvertStartSchemaType } from "./convert/Start";
import { cloudStorageList, cloudStorageListSchemaType } from "./list";
import { alibabaCloudRename, cloudStorageRenameSchemaType } from "./alibabaCloud/rename";
import {
    alibabaCloudUploadStart,
    alibabaCloudUploadStartSchemaType,
} from "./alibabaCloud/upload/Start";
import {
    alibabaCloudUploadFinish,
    alibabaCloudUploadFinishSchemaType,
} from "./alibabaCloud/upload/Finish";
import { fileConvertFinish, fileConvertFinishSchemaType } from "./convert/Finish";
import { alibabaCloudRemoveFile, alibabaCloudRemoveFileSchemaType } from "./alibabaCloud/remove";

export const httpCloudStorage: Readonly<FastifyRoutes[]> = Object.freeze([
    Object.freeze({
        method: "post",
        path: "cloud-storage/alibaba-cloud/upload/start",
        handler: alibabaCloudUploadStart,
        auth: true,
        schema: alibabaCloudUploadStartSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/alibaba-cloud/upload/finish",
        handler: alibabaCloudUploadFinish,
        auth: true,
        schema: alibabaCloudUploadFinishSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/alibaba-cloud/rename",
        handler: alibabaCloudRename,
        auth: true,
        schema: cloudStorageRenameSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/alibaba-cloud/remove",
        handler: alibabaCloudRemoveFile,
        auth: true,
        schema: alibabaCloudRemoveFileSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/convert/start",
        handler: fileConvertStart,
        auth: true,
        schema: fileConvertStartSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/convert/finish",
        handler: fileConvertFinish,
        auth: true,
        schema: fileConvertFinishSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/list",
        handler: cloudStorageList,
        auth: true,
        schema: cloudStorageListSchemaType,
    }),
]);
