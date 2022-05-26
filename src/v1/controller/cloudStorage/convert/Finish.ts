import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../dao";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { whiteboardQueryConversionTask } from "../../../utils/request/whiteboard/WhiteboardRequest";
import { FileAffiliation, FileConvertStep } from "../../../../model/cloudStorage/Constants";
import { determineType, isConvertDone, isConvertFailed } from "./Utils";
import { AbstractController } from "../../../../abstract/controller";
import { Controller } from "../../../../decorator/Controller";
import path from "path";
import axios from "axios";
import {
    LocalCoursewarePayload,
    WhiteboardConvertPayload,
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
            ["file_url", "affiliation", "payload"],
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

        const { file_url: resource, payload, affiliation } = fileInfo;

        if (!("region" in payload) || !payload.convertStep) {
            throw new Error("unsupported current file conversion");
        }

        if (isConvertDone(payload.convertStep)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileIsConverted,
            };
        }

        if (isConvertFailed(payload.convertStep)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileConvertFailed,
            };
        }

        const convertStatus = await FileConvertFinish.queryConversionStatus(
            resource,
            payload,
            affiliation,
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
        payload: WhiteboardConvertPayload | LocalCoursewarePayload,
        affiliation: FileAffiliation,
    ): Promise<"Waiting" | "Converting" | "Finished" | "Fail" | null> {
        if (affiliation === FileAffiliation.LocalCourseware) {
            const fileName = path.basename(resource);
            const dir = resource.substr(0, resource.length - fileName.length);
            const resultPath = `${dir}result`;

            try {
                const response = await axios.head(resultPath);
                return response.headers["x-oss-meta-success"] === "true" ? "Finished" : "Fail";
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    return "Converting";
                }

                throw error;
            }
        } else if (affiliation === FileAffiliation.WhiteboardConvert) {
            const { taskUUID, region } = payload as WhiteboardConvertPayload;
            const resourceType = determineType(resource);
            const result = await whiteboardQueryConversionTask(region, taskUUID, resourceType);
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
