import path from "path";
import { In } from "typeorm";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { getDisposition, ossClient } from "../Utils";
import { AbstractController } from "../../../../../abstract/controller";
import { Controller } from "../../../../../decorator/Controller";
import { URL } from "url";
import { aliGreenText } from "../../../../utils/AliGreen";
import { ControllerError } from "../../../../../error/ControllerError";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";
import { dataSource } from "../../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/alibaba-cloud/rename",
    auth: true,
})
export class AlibabaCloudRename extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileUUID", "fileName"],
            properties: {
                fileUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
                fileName: {
                    type: "string",
                    format: "file-suffix",
                    maxLength: 50,
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID, fileName } = this.body;
        const userUUID = this.userUUID;

        if (await aliGreenText.textNonCompliant(fileName)) {
            throw new ControllerError(ErrorCode.NonCompliant);
        }

        const userFileInfo = await CloudStorageUserFilesDAO().findOne(["id"], {
            file_uuid: fileUUID,
            user_uuid: userUUID,
        });

        if (userFileInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const fileInfo = await CloudStorageFilesDAO().findOne(
            ["file_name", "file_url", "resource_type"],
            {
                file_uuid: fileUUID,
                resource_type: In([
                    FileResourceType.WhiteboardConvert,
                    FileResourceType.NormalResources,
                    FileResourceType.WhiteboardProjector,
                ]),
            },
        );

        if (fileInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        if (path.extname(fileName) !== path.extname(fileInfo.file_name)) {
            return {
                status: Status.Failed,
                code: ErrorCode.ParamsCheckFailed,
            };
        }

        await dataSource.transaction(async t => {
            await CloudStorageFilesDAO(t).update(
                {
                    file_name: fileName,
                },
                {
                    file_uuid: fileUUID,
                },
            );

            if (fileInfo.resource_type === FileResourceType.Directory) {
                throw new Error("unsupported current file rename");
            }

            const filePath = new URL(fileInfo.file_url).pathname.slice(1);
            await ossClient
                .copy(filePath, filePath, {
                    headers: { "Content-Disposition": getDisposition(fileName) },
                })
                .catch(() => {});
        });

        return {
            status: Status.Success,
            data: {},
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }
}

interface RequestType {
    body: {
        fileUUID: string;
        fileName: string;
    };
}

interface ResponseType {}
