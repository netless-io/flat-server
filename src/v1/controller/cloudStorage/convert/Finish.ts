import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../dao";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { whiteboardQueryConversionTask } from "../../../utils/request/whiteboard/Whiteboard";
import { FileConvertStep } from "../Constants";
import { determineType, isConvertDone, isConvertFailed } from "./Utils";

export const fileConvertFinish = async (
    req: PatchRequest<{
        Body: FileConvertFinishBody;
    }>,
): Response<FileConvertFinishResponse> => {
    const { fileUUID } = req.body;
    const { userUUID } = req.user;

    try {
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
            ["file_url", "convert_step", "task_uuid"],
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

        const { file_url: resource, convert_step, task_uuid } = fileInfo;

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

        const fileType = determineType(resource);
        const result = await whiteboardQueryConversionTask(task_uuid, fileType);
        const convertStatus = result.data.status;

        switch (convertStatus) {
            case "Finished": {
                await CloudStorageFilesDAO().update(
                    {
                        convert_step: FileConvertStep.Done,
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
                        convert_step: FileConvertStep.Failed,
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
            default:
                return {
                    status: Status.Failed,
                    code:
                        convertStatus === "Waiting"
                            ? ErrorCode.FileIsConvertWaiting
                            : ErrorCode.FileIsConverting,
                };
        }
    } catch (err) {
        console.error(err);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface FileConvertFinishBody {
    fileUUID: string;
}

export const fileConvertFinishSchemaType: FastifySchema<{
    body: FileConvertFinishBody;
}> = {
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

interface FileConvertFinishResponse {}
