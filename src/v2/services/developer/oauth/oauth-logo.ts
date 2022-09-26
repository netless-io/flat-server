import { createLoggerService, parseError } from "../../../../logger";
import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { useOnceService } from "../../../service-locator";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import {
    DeveloperOAuthLogoFinishConfig,
    DeveloperOAuthLogoStartConfig,
    DeveloperOAuthLogoStartReturn,
    GetDeveloperOAuthLogoByRedisReturn,
} from "./oauth-logo.type";
import { DeveloperOAuthInfoService } from "./oauth-info";
import { OAuth } from "../../../../constants/Config";
import path from "path";

export class DeveloperOAuthLogoService {
    private readonly logger = createLoggerService<"developerOAuthLogo">({
        serviceName: "developerOAuthLogo",
        ids: this.ids,
    });

    private readonly oss = useOnceService("oss", this.ids);

    constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async start(
        config: DeveloperOAuthLogoStartConfig,
    ): Promise<DeveloperOAuthLogoStartReturn> {
        const { fileName, fileSize } = config;
        const fileUUID = v4();

        await RedisService.hmset(
            RedisKey.oauthLogoFileInfo(config.oauthUUID, fileUUID),
            {
                fileName,
            },
            60 * 60,
        );

        const ossFilePath = DeveloperOAuthLogoService.generateOSSFilePath(
            fileName,
            config.oauthUUID,
            fileUUID,
        );
        const { policy, signature } = this.oss.policyTemplate(fileName, ossFilePath, fileSize);

        this.logger.debug("upload oauth logo", {
            developerOAuthLogo: {
                fileUUID,
                ossFilePath,
                policy,
                signature,
            },
        });

        return {
            fileUUID,
            ossFilePath,
            ossDomain: this.oss.domain,
            policy,
            signature,
        };
    }

    public async finish(config: DeveloperOAuthLogoFinishConfig): Promise<void> {
        const { fileUUID, oauthUUID } = config;

        const { fileName } = await this.getFileInfoByRedis(oauthUUID, fileUUID);

        const ossFilePath = DeveloperOAuthLogoService.generateOSSFilePath(
            fileName,
            config.oauthUUID,
            fileUUID,
        );
        await this.oss.assertExists(ossFilePath);

        const complianceImage = useOnceService("complianceImage", this.ids);
        await complianceImage.assertImageNormal(ossFilePath);

        const developerOAuthInfoSVC = new DeveloperOAuthInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );
        const oldLogoURL = await developerOAuthInfoSVC.getLogoURL(oauthUUID);
        await developerOAuthInfoSVC.updateLogoURL(oauthUUID, `${this.oss.domain}/${ossFilePath}`);

        this.oss.remove(oldLogoURL).catch(error => {
            this.logger.warn("remove oauth logo failed", {
                ...parseError(error),
                developerOAuthLogo: {
                    fileUUID,
                    oldLogoURL,
                },
            });
        });

        await RedisService.del(RedisKey.oauthLogoFileInfo(oauthUUID, fileUUID)).catch(error => {
            this.logger.warn("remove oauth logo info failed in redis", {
                ...parseError(error),
                developerOAuthLogo: {
                    redisKey: RedisKey.oauthLogoFileInfo(oauthUUID, fileUUID),
                    fileUUID,
                },
            });
        });
    }

    public async getFileInfoByRedis(
        oauthUUID: string,
        fileUUID: string,
    ): Promise<GetDeveloperOAuthLogoByRedisReturn> {
        const redisKey = RedisKey.oauthLogoFileInfo(oauthUUID, fileUUID);
        const fileInfo = await RedisService.hmget(redisKey, ["fileName"]);

        const fileName = fileInfo[0];

        if (!fileName) {
            this.logger.info("not found file in redis", {
                developerOAuthLogo: {
                    fileUUID,
                    fileNameIsEmpty: !fileName,
                },
            });
            throw new FError(ErrorCode.FileNotFound);
        }

        return {
            fileName,
        };
    }

    public static generateOSSFilePath = (
        fileName: string,
        oauthUUID: string,
        fileUUID: string,
    ): string => {
        return `${OAuth.logo.prefixPath}/${oauthUUID}/${fileUUID}${path.extname(fileName)}`;
    };
}
