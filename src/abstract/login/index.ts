import redisService from "../../thirdPartyService/RedisService";
import { RedisKey } from "../../utils/Redis";
import { LoginClassParams } from "./Type";
import { ErrorCode } from "../../ErrorCode";
import { ControllerError } from "../../error/ControllerError";
import { Logger, LoggerAPI } from "../../logger";
import { getDisposition, ossClient } from "../../v1/controller/cloudStorage/alibabaCloud/Utils";
import {
    getFilePath,
    getOSSFileURLPath,
} from "../../v1/controller/cloudStorage/alibabaCloud/upload/Utils";
import { ServiceCloudStorageConfigs } from "../../v1/service/cloudStorage/CloudStorageConfigs";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { ServiceCloudStorageFiles } from "../../v1/service/cloudStorage/CloudStorageFiles";
import { v4 } from "uuid";
import { ServiceCloudStorageUserFiles } from "../../v1/service/cloudStorage/CloudStorageUserFiles";
import { ServiceUserPhone } from "../../v1/service/user/UserPhone";
import { FileConvertStep, FileResourceType } from "../../model/cloudStorage/Constants";
import { ServiceUser } from "../../v1/service/user/User";
import { Whiteboard } from "../../constants/Config";

export abstract class AbstractLogin {
    protected readonly userUUID: string;

    protected constructor(params: LoginClassParams) {
        this.userUUID = params.userUUID;
    }

    public abstract register(info: any): Promise<void>;

    public static async assertHasAuthUUID(
        authUUID: string,
        logger: Logger<LoggerAPI>,
    ): Promise<void> {
        const result = await redisService.get(RedisKey.authUUID(authUUID));

        if (result === null) {
            logger.warn("uuid verification failed");
            throw new ControllerError(ErrorCode.ParamsCheckFailed);
        }
    }

    public async tempSaveUserInfo(
        authUUID: string,
        userInfo: Omit<UserInfo, "userUUID"> & { [key in string]: any },
    ): Promise<void> {
        await redisService.set(
            RedisKey.authUserInfo(authUUID),
            JSON.stringify({
                ...userInfo,
                userUUID: this.userUUID,
                hasPhone: await ServiceUserPhone.exist(this.userUUID),
                hasPassword: await ServiceUser.hasPassword(this.userUUID),
            }),
            60 * 60,
        );
    }

    protected async setGuidePPTX(
        svc: {
            cloudStorageConfigs: ServiceCloudStorageConfigs;
            cloudStorageFiles: ServiceCloudStorageFiles;
            cloudStorageUserFiles: ServiceCloudStorageUserFiles;
        },
        t: EntityManager,
    ): Promise<any> {
        const CN = Whiteboard.convertRegion === "cn-hz";

        const fileUUID = v4();
        const name = CN ? "开始使用 Flat.pptx" : "Get Started with Flat.pptx";
        const pptxPath = getFilePath(name, fileUUID);
        const fileSize = CN ? 5027927 : 5141265;

        await ossClient.copy(pptxPath, AbstractLogin.guidePPTX, {
            headers: { "Content-Disposition": getDisposition(name) },
        });

        return Promise.all([
            svc.cloudStorageConfigs.createOrUpdate(fileSize, t),
            svc.cloudStorageFiles.create({
                payload: {
                    region: Whiteboard.convertRegion,
                    convertStep: FileConvertStep.None,
                },
                fileURL: getOSSFileURLPath(pptxPath),
                fileSize: fileSize,
                fileUUID: fileUUID,
                fileName: name,
                resourceType: FileResourceType.WhiteboardProjector,
            }),
            svc.cloudStorageUserFiles.create(fileUUID),
        ]);
    }

    public static get guidePPTX(): string {
        return "guide-pptx/guide.pptx";
    }
}

interface UserInfo {
    name: string;
    avatar: string;
    userUUID: string;
    token: string;
}
