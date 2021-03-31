import path from "path";
import { getConnection } from "typeorm";
import { Status } from "../../../../Constants";
import { ErrorCode } from "../../../../ErrorCode";
import { CloudStorageFilesDAO, CloudStorageUserFilesDAO } from "../../../dao";
import { FastifySchema, PatchRequest, Response } from "../../../types/Server";
import { getDisposition, getFilePath, ossClient } from "../upload/alibabaCloud/Utils";

export const cloudStorageRename = async (
    req: PatchRequest<{ Body: CloudStorageRenameBody }>,
): Response<CloudStorageRenameResponse> => {
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

        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            const fileSuffix = path.extname(fileInfo.file_name);
            commands.push(
                CloudStorageFilesDAO(t).update(
                    {
                        file_name: `${fileName}${fileSuffix}`,
                    },
                    {
                        file_uuid: fileUUID,
                    },
                ),
            );

            const filePath = getFilePath(fileName, fileUUID);
            commands.push(
                ossClient.copy(filePath, filePath, {
                    headers: { "Content-Disposition": getDisposition(fileName) },
                }),
            );

            await Promise.all(commands);
        });

        return {
            status: Status.Success,
            data: {},
        };
    } catch (err) {
        console.error(err);
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

interface CloudStorageRenameBody {
    fileUUID: string;
    fileName: string;
}

export const cloudStorageRenameSchemaType: FastifySchema<{
    body: CloudStorageRenameBody;
}> = {
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

interface CloudStorageRenameResponse {}
