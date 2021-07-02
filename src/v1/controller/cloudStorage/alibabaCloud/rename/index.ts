import path from "path";
import { getConnection } from "typeorm";
import { Status } from "../../../../../constants/Project";
import { ErrorCode } from "../../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../../../dao";
import { Controller, FastifySchema } from "../../../../../types/Server";
import { getDisposition, getFilePath, ossClient } from "../Utils";
import { parseError } from "../../../../../logger";

export const alibabaCloudRename: Controller<
    AlibabaCloudRenameRequest,
    AlibabaCloudRenameResponse
> = async ({ req, logger }) => {
    const { fileUUID, fileName } = req.body;
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

        const fileInfo = await CloudStorageFilesDAO().findOne(["file_name"], {
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

        await getConnection().transaction(async t => {
            await CloudStorageFilesDAO(t).update(
                {
                    file_name: fileName,
                },
                {
                    file_uuid: fileUUID,
                },
            );

            const filePath = getFilePath(fileName, fileUUID);
            await ossClient.copy(filePath, filePath, {
                headers: { "Content-Disposition": getDisposition(fileName) },
            });
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        logger.error("request failed", parseError(err));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface AlibabaCloudRenameRequest {
    body: {
        fileUUID: string;
        fileName: string;
    };
}

export const cloudStorageRenameSchemaType: FastifySchema<AlibabaCloudRenameRequest> = {
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

interface AlibabaCloudRenameResponse {}
