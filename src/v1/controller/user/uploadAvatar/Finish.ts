import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Region, Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { ErrorCode } from "../../../../ErrorCode";
import { createLoggerContentCensorship, parseError } from "../../../../logger";
import RedisService from "../../../../thirdPartyService/RedisService";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RedisKey } from "../../../../utils/Redis";
import { ServiceUser } from "../../../service/user/User";
import { aliGreenVideo } from "../../../utils/AliGreen";
import { getOSSDomain, getOSSFileURLPath } from "../../cloudStorage/alibabaCloud/upload/Utils";
import { deleteObject, isExistObject } from "../../cloudStorage/alibabaCloud/Utils";
import { getFilePath } from "./Utils";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";

@Controller<RequestType, ResponseType>({
    method: "post",
    path: "user/upload-avatar/finish",
    auth: true,
})
export class UploadAvatarFinish extends AbstractController<RequestType, ResponseType> {
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

    public readonly svc: {
        user: ServiceUser;
    };

    private static readonly censorshipLogger = createLoggerContentCensorship({});

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
        };
    }

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID } = this.body;
        const userUUID = this.userUUID;

        const redisKey = RedisKey.userAvatarFileInfo(userUUID, fileUUID);
        const fileInfo = await RedisService.hmget(redisKey, ["fileName", "fileSize", "region"]);

        const fileName = fileInfo[0];
        const fileSize = Number(fileInfo[1]);
        const region = fileInfo[2] as Region;

        if (!fileName || Number.isNaN(fileSize) || !Object.values(Region).includes(region)) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const filePath = getFilePath(fileName, userUUID, fileUUID);

        if (!(await isExistObject(filePath, region))) {
            return {
                status: Status.Failed,
                code: ErrorCode.FileNotFound,
            };
        }

        const alibabaCloudFileURL = getOSSFileURLPath(filePath, region);

        if (await UploadAvatarFinish.isIllegal(alibabaCloudFileURL)) {
            await deleteObject(filePath, region);

            return {
                status: Status.Failed,
                code: ErrorCode.CensorshipFailed,
            };
        }

        // Delete previous avatar and set new avatar.
        await dataSource.transaction(async t => {
            await this.svc.user.updateAvatar(alibabaCloudFileURL, t);

            const avatarURL = (await this.svc.user.nameAndAvatar())?.avatarURL;
            if (avatarURL) {
                // prefix = "https://bucket.endpoint"
                const prefix = getOSSDomain(region);
                if (avatarURL.startsWith(prefix)) {
                    await deleteObject(avatarURL.slice(prefix.length), region);
                }
            }

            await RedisService.del(redisKey).catch(error => {
                this.logger.warn("delete redis key failed", parseError(error));
            });
        });

        return {
            status: Status.Success,
            data: {
                avatarURL: alibabaCloudFileURL,
            },
        };
    }

    public errorHandler(error: Error): ResponseError {
        return this.autoHandlerError(error);
    }

    private static async isIllegal(imageURL: string): Promise<boolean> {
        UploadAvatarFinish.censorshipLogger.debug("check user avatar url", {
            censorshipDetail: {
                imageURL,
            },
        });

        const result = await aliGreenVideo.imageScan(imageURL);

        if (!result.status) {
            UploadAvatarFinish.censorshipLogger.error(
                "user avatar scan request failed",
                parseError(result.error),
            );
            return false;
        }

        if (result.data.every(i => i.suggestion !== "block")) {
            return false;
        }

        UploadAvatarFinish.censorshipLogger.debug("user avatar illegal", {
            censorshipDetail: {
                imageURL,
            },
            censorshipResult: JSON.stringify(result.data),
        });

        return true;
    }
}

interface RequestType {
    body: {
        fileUUID: string;
    };
}

interface ResponseType {
    avatarURL: string;
}
