import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import {
    whiteboardQueryConversionTask,
    whiteboardQueryProjectorTask,
} from "../../../utils/request/whiteboard/WhiteboardRequest";
import { FileConvertStep, FileResourceType } from "../../../../model/cloudStorage/Constants";
import { determineType, isConvertDone, isConvertFailed } from "./Utils";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import {
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../../model/cloudStorage/Types";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "cloud-storage/convert/finish",
    auth: true,
})
export class FileConvertFinish extends AbstractController<RequestType, ResponseType> {
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
            ["file_url", "resource_type", "payload"],
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

        const { file_url: resource, payload, resource_type } = fileInfo;

        const { convertStep } = payload as { convertStep: FileConvertStep };

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

        const convertStatus = await FileConvertFinish.queryConversionStatus(
            resource,
            // @ts-ignore
            payload,
            resource_type,
        );

        if (convertStatus === null) {
            throw new Error("unsupported current file conversion");
        }

        switch (convertStatus) {
            case "Finished": {
                await CloudStorageFilesDAO().update(
                    {
                        payload: {
                            ...payload,
                            convertStep: FileConvertStep.Done,
                        },
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
            case "Abort":
            case "Fail": {
                await CloudStorageFilesDAO().update(
                    {
                        payload: {
                            ...payload,
                            convertStep: FileConvertStep.Failed,
                        },
                    },
                    {
                        file_uuid: fileUUID,
                    },
                );

                return {
                    status: Status.Failed,
                    code: ErrorCode.FileConvertFailed,
                };
            }
            default: {
                return {
                    status: Status.Failed,
                    code:
                        convertStatus === "Waiting"
                            ? ErrorCode.FileIsConvertWaiting
                            : ErrorCode.FileIsConverting,
                };
            }
        }
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private static async queryConversionStatus(
        resource: string,
        payload: WhiteboardConvertPayload,
        resourceType: FileResourceType,
    ): Promise<"Waiting" | "Converting" | "Finished" | "Fail" | "Abort" | null> {
        if (resourceType === FileResourceType.WhiteboardConvert) {
            const { taskUUID } = payload;
            const resourceType = determineType(resource);
            const result = await whiteboardQueryConversionTask(taskUUID!, resourceType);
            return result.data.status;
        } else if (resourceType === FileResourceType.WhiteboardProjector) {
            const { taskUUID } = payload as WhiteboardProjectorPayload;
            const result = await whiteboardQueryProjectorTask(taskUUID!);
            return result.data.status;
        }

        return null;
    }
}

interface RequestType {
    body: {
        fileUUID: string;
    };
}

interface ResponseType {}
