import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { createWhiteboardTaskToken } from "../../../../utils/NetlessToken";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { whiteboardCreateConversionTask } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { FileConvertStep } from "../../../../model/cloudStorage/Constants";
import { determineType, isConverting, isConvertDone, isConvertFailed } from "./Utils";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import path from "path";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/convert/start",
    auth: true,
})
export class FileConvertStart extends AbstractController<RequestType, ResponseType> {
    public static readonly schema: FastifySchema<RequestType> = {
        body: {
            type: "object",
            required: ["fileUUID"],
            properties: {
                fileUUID: {
                    type: "string",
                    format: "uuid-v4",
                },
            },
        },
    };

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID } = this.body;
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

        const fileInfo = await CloudStorageFilesDAO().findOne(
            ["file_url", "convert_step", "region"],
            {
                file_uuid: fileUUID,
            },
        );

        if (fileInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const { file_url: resource, convert_step, region } = fileInfo;

        if (isConverting(convert_step)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileConvertFailed,
            };
        }

        if (isConvertDone(convert_step)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileIsConverted,
            };
        }

        if (isConvertFailed(convert_step)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileConvertFailed,
            };
        }

        if (region === "none") {
            throw new Error("unsupported current file conversion");
        }

        const resourceType = determineType(resource);

        const result = await whiteboardCreateConversionTask(region, {
            resource,
            type: resourceType,
            scale: FileConvertStart.scaleByFileType(resource),
            preview: resourceType === "dynamic",
            pack: resourceType === "static",
            canvasVersion: resourceType === "dynamic",
        });

        const taskUUID = result.data.uuid;
        const taskToken = createWhiteboardTaskToken(taskUUID);
        await CloudStorageFilesDAO().update(
            {
                task_uuid: taskUUID,
                task_token: taskToken,
                convert_step: FileConvertStep.Converting,
            },
            {
                file_uuid: fileUUID,
            },
        );

        return {
            status: Status.Success,
            data: {
                taskUUID,
                taskToken,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    // see: https://developer.netless.link/server-en/home/server-conversion
    private static scaleByFileType(resource: string): number {
        const extname = path.extname(resource);

        switch (extname) {
            case ".pdf": {
                return 2.4;
            }
            default: {
                return 1.2;
            }
        }
    }
}

interface RequestType {
    body: {
        fileUUID: string;
    };
}

interface ResponseType {
    taskUUID: string;
    taskToken: string;
}
