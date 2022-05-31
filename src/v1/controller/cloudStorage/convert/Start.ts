import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { createWhiteboardTaskToken } from "../../../../utils/NetlessToken";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { whiteboardCreateConversionTask } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { FileAffiliation, FileConvertStep } from "../../../../model/cloudStorage/Constants";
import { determineType, isConvertDone, isConvertFailed, isConverting } from "./Utils";
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

        const fileInfo = await CloudStorageFilesDAO().findOne(["file_url", "payload"], {
            file_uuid: fileUUID,
            affiliation: FileAffiliation.WhiteboardConvert,
        });

        if (fileInfo === undefined) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const { file_url: resource, payload } = fileInfo;

        const { convertStep, region } = payload as any;

        if (isConverting(convertStep)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileConvertFailed,
            };
        }

        if (isConvertDone(convertStep)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileIsConverted,
            };
        }

        if (isConvertFailed(convertStep)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileConvertFailed,
            };
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
                payload: {
                    taskUUID,
                    taskToken,
                    region,
                    convertStep: FileConvertStep.Converting,
                },
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
