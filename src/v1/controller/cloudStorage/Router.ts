import { FastifyRoutes } from "../../types/Server";
import { fileConvertStart, fileConvertStartSchemaType } from "./convert/Start";
import { cloudStorageList, cloudStorageListSchemaType } from "./list";
import { cloudStorageRename, cloudStorageRenameSchemaType } from "./rename";
import {
    alibabaCloudUploadStart,
    alibabaCloudUploadStartSchemaType,
} from "./upload/alibabaCloud/Start";

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
        path: "cloud-storage/list",
        handler: cloudStorageList,
        auth: true,
        schema: cloudStorageListSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/rename",
        handler: cloudStorageRename,
        auth: true,
        schema: cloudStorageRenameSchemaType,
    }),
    Object.freeze({
        method: "post",
        path: "cloud-storage/convert/start",
        handler: fileConvertStart,
        auth: true,
        schema: fileConvertStartSchemaType,
    }),
]);
