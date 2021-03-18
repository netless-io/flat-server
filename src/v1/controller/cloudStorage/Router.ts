import { FastifyRoutes } from "../../types/Server";
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
]);
