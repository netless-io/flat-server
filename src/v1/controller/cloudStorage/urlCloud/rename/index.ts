import { AbstractController } from "../../../../../abstract/controller";
import { FastifySchema, Response, ResponseError } from "../../../../../types/Server";
import { Controller } from "../../../../../decorator/Controller";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../../dao";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import path from "path";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/url-cloud/rename",
    auth: true,
})
export class URLCloudRename extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileUUID", "fileName"],
            properties: {
                fileName: {
                    type: "string",
                    format: "url-file-suffix",
                    maxLength: 128,
                },
                fileUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID, fileName } = this.body;
        const userUUID = this.userUUID;

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

        const fileInfo = await CloudStorageFilesDAO().findOne(["file_name", "region"], {
            file_uuid: fileUUID,
        });

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

        if (fileInfo.region !== "none") {
            throw new Error("unsupported current file rename");
        }

        await CloudStorageFilesDAO().update(
            {
                file_name: fileName,
            },
            {
                file_uuid: fileUUID,
            },
        );

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
