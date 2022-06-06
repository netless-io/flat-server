import { getConnection } from "typeorm";
import { AbstractController, ControllerClassParams } from "../../../../abstract/controller";
import { Region, Status } from "../../../../constants/Project";
import { Controller } from "../../../../decorator/Controller";
import { ErrorCode } from "../../../../ErrorCode";
import { createLoggerContentCensorship, Logger, parseError } from "../../../../logger";
import { LoggerContentCensorship } from "../../../../logger/LogConext";
import RedisService from "../../../../thirdPartyService/RedisService";
import { FastifySchema, Response, ResponseError } from "../../../../types/Server";
import { RedisKey } from "../../../../utils/Redis";
import { ServiceUser } from "../../../service/user/User";
import { aliGreenVideo } from "../../../utils/AliGreen";
import { getOSSDomain, getOSSFileURLPath } from "../../cloudStorage/alibabaCloud/upload/Utils";
import { deleteObject, isExistObject } from "../../cloudStorage/alibabaCloud/Utils";
import { getFilePath } from "./Utils";

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

    public logger: Logger<LoggerContentCensorship>;

    public constructor(params: ControllerClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
        };

        this.logger = createLoggerContentCensorship({});
    }

    public async execute(): Promise<Response<ResponseType>> {
        const { fileUUID } = this.body;
        const userUUID = this.userUUID;

        const fileInfo = await RedisService.hmget(
            RedisKey.cloudStorageFileInfo(userUUID, fileUUID),
            ["fileName", "fileSize", "region"],
        );

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

        if (await this.isIllegal(alibabaCloudFileURL)) {
            await deleteObject(filePath, region);

            return {
                status: Status.Failed,
                code: ErrorCode.CensorshipFailed,
            };
        }

        // Delete previous avatar and set new avatar.
        await getConnection().transaction(async t => {
            const commands: Promise<unknown>[] = [];

            commands.push(
                this.svc.user.nameAndAvatar().then(nameAndAvatar => {
                    if (nameAndAvatar) {
                        // prefix = "https://bucket.endpoint"
                        const prefix = getOSSDomain(region);

                        if (nameAndAvatar.avatarURL.startsWith(prefix)) {
                            return deleteObject(
                                nameAndAvatar.avatarURL.slice(prefix.length + 1),
                                region,
                            );
                        }
                    }
                    return;
                }),
            );

            commands.push(this.svc.user.updateAvatar(alibabaCloudFileURL, t));

            await Promise.all(commands);
            await RedisService.del(RedisKey.cloudStorageFileInfo(userUUID, fileUUID));
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

    private async isIllegal(imageURL: string): Promise<boolean> {
        this.logger.debug("check image url", {
            censorshipDetail: {
                imageURL,
            },
        });

        const result = await aliGreenVideo.imageScan(imageURL);

        if (!result.status) {
            this.logger.error("image scan request failed", parseError(result.error));
            return false;
        }

        if (result.data.every(i => i.suggestion !== "block")) {
            return false;
        }

        this.logger.debug("video illegal", {
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
