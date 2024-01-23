import { createLoggerService } from "../../../logger";
import { EntityManager, In } from "typeorm";
import {
    FileConvertStep,
    FileResourceType,
    supportConvertResourceType,
} from "../../../model/cloudStorage/Constants";
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import {
    WhiteboardConvertPayload,
    WhiteboardProjectorPayload,
} from "../../../model/cloudStorage/Types";
import {
    CloudStorageConvertFileInfo,
    CloudStorageConvertStart,
    WhiteboardConvertInfo,
    WhiteboardProjectorInfo,
} from "./convert.type";
import { cloudStorageFilesDAO } from "../../dao";
import { CloudStorageInfoService } from "./info";
import { WhiteboardConversionService } from "../whiteboard/conversion";
import { WhiteboardTokenService } from "../whiteboard/token";
import { WhiteboardProjectorService } from "../whiteboard/projector";
import { parseError } from "../../../logger";

export class CloudStorageConvertService {
    private readonly logger = createLoggerService<"cloudStorageConvert">({
        serviceName: "cloudStorageConvert",
        ids: this.ids,
    });

    public constructor(
        private readonly ids: IDS,
        private readonly DBTransaction: EntityManager,
        private readonly userUUID: string,
    ) {}

    public async start(fileUUID: string): Promise<CloudStorageConvertStart> {
        const cloudStorageInfoSVC = new CloudStorageInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        await cloudStorageInfoSVC.assertFileOwnership(fileUUID);
        const { fileResourceType, payload, fileURL } = await this.getConvertFileInfo(fileUUID);

        switch (fileResourceType) {
            case FileResourceType.WhiteboardConvert: {
                return this.startWhiteboardConvert(fileUUID, fileURL, payload);
            }
            case FileResourceType.WhiteboardProjector: {
                return this.startWhiteboardProjector(fileUUID, fileURL, payload);
            }
        }
    }

    public async finish(fileUUID: string): Promise<void> {
        const cloudStorageInfoSVC = new CloudStorageInfoService(
            this.ids,
            this.DBTransaction,
            this.userUUID,
        );

        await cloudStorageInfoSVC.assertFileOwnership(fileUUID);
        const { fileResourceType, payload } = await this.getConvertFileInfo(fileUUID);

        switch (fileResourceType) {
            case FileResourceType.WhiteboardConvert: {
                return this.finishWhiteboardConvert(fileUUID, payload);
            }
            case FileResourceType.WhiteboardProjector: {
                return this.finishWhiteboardProjector(fileUUID, payload);
            }
        }
    }

    public async getConvertFileInfo(fileUUID: string): Promise<CloudStorageConvertFileInfo> {
        const result = await cloudStorageFilesDAO.findOne(
            this.DBTransaction,
            ["resource_type", "payload", "file_url"],
            {
                file_uuid: fileUUID,
                resource_type: In(supportConvertResourceType),
            },
        );

        if (!result) {
            throw new FError(ErrorCode.FileNotFound);
        }

        return {
            fileResourceType: result.resource_type as any,
            payload: result.payload as any,
            fileURL: result.file_url,
        };
    }

    public async startWhiteboardConvert(
        fileUUID: string,
        fileURL: string,
        payload: WhiteboardConvertPayload,
    ): Promise<WhiteboardConvertInfo> {
        this.logger.debug("start whiteboard convert");

        if (payload.convertStep !== FileConvertStep.None) {
            throw new FError(ErrorCode.FileNotIsConvertNone);
        }

        const whiteboardConversionSVC = new WhiteboardConversionService(this.ids);

        const taskUUID = await whiteboardConversionSVC.create(fileURL).catch(error => {
            this.logger.error("request failed", parseError(error));
            return null;
        });
        if (!taskUUID) {
            await cloudStorageFilesDAO.update(
                // we don't want to rollback this action
                null,
                {
                    payload: {
                        convertStep: FileConvertStep.Failed,
                        region: payload.region,
                    },
                },
                {
                    file_uuid: fileUUID,
                },
            );

            throw new FError(ErrorCode.FileConvertFailed);
        }

        const taskToken = WhiteboardTokenService.createTask(taskUUID);

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                payload: {
                    taskUUID,
                    taskToken,
                    convertStep: FileConvertStep.Converting,
                    region: payload.region,
                },
            },
            {
                file_uuid: fileUUID,
            },
        );

        return {
            resourceType: FileResourceType.WhiteboardConvert,
            whiteboardConvert: {
                taskUUID,
                taskToken,
            },
        };
    }

    public async finishWhiteboardConvert(
        fileUUID: string,
        payload: WhiteboardConvertPayload,
    ): Promise<void> {
        this.logger.debug("finish whiteboard convert");

        if (payload.convertStep === FileConvertStep.Done) {
            return;
        }

        if (payload.convertStep !== FileConvertStep.Converting) {
            throw new FError(ErrorCode.FileNotIsConverting);
        }

        const whiteboardConversionSVC = new WhiteboardConversionService(this.ids);

        const status = await whiteboardConversionSVC.query(payload.taskUUID!).catch(error => {
            this.logger.error("request failed", parseError(error));
            return "Fail";
        });

        if (status === "Waiting") {
            throw new FError(ErrorCode.FileIsConvertWaiting);
        }

        if (status === "Converting") {
            throw new FError(ErrorCode.FileIsConverting);
        }

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                payload: {
                    taskUUID: payload.taskUUID!,
                    taskToken: payload.taskToken!,
                    region: payload.region,
                    convertStep:
                        status === "Finished" ? FileConvertStep.Done : FileConvertStep.Failed,
                },
            },
            {
                file_uuid: fileUUID,
            },
        );
    }

    public async startWhiteboardProjector(
        fileUUID: string,
        fileURL: string,
        payload: WhiteboardProjectorPayload,
    ): Promise<WhiteboardProjectorInfo> {
        this.logger.debug("start whiteboard projector");

        if (payload.convertStep !== FileConvertStep.None) {
            throw new FError(ErrorCode.FileNotIsConvertNone);
        }

        const whiteboardProjectorSVC = new WhiteboardProjectorService(this.ids);

        const taskUUID = await whiteboardProjectorSVC.create(fileURL).catch(error => {
            this.logger.error("request failed", parseError(error));
            return null;
        });
        if (!taskUUID) {
            await cloudStorageFilesDAO.update(
                // we don't want to rollback this action
                null,
                {
                    payload: {
                        convertStep: FileConvertStep.Failed,
                        region: payload.region,
                    },
                },
                {
                    file_uuid: fileUUID,
                },
            );

            throw new FError(ErrorCode.FileConvertFailed);
        }

        const taskToken = WhiteboardTokenService.createTask(taskUUID);

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                payload: {
                    taskUUID,
                    taskToken,
                    convertStep: FileConvertStep.Converting,
                    region: payload.region,
                },
            },
            {
                file_uuid: fileUUID,
            },
        );

        return {
            resourceType: FileResourceType.WhiteboardProjector,
            whiteboardProjector: {
                taskUUID,
                taskToken,
            },
        };
    }

    public async finishWhiteboardProjector(
        fileUUID: string,
        payload: WhiteboardProjectorPayload,
    ): Promise<void> {
        this.logger.debug("finish whiteboard projector");

        if (payload.convertStep === FileConvertStep.Done) {
            return;
        }

        if (payload.convertStep !== FileConvertStep.Converting) {
            throw new FError(ErrorCode.FileNotIsConverting);
        }

        const whiteboardProjectorSVC = new WhiteboardProjectorService(this.ids);

        const status = await whiteboardProjectorSVC.query(payload.taskUUID!).catch(error => {
            this.logger.error("request failed", parseError(error));
            return "Fail";
        });

        if (status === "Waiting") {
            throw new FError(ErrorCode.FileIsConvertWaiting);
        }

        if (status === "Converting") {
            throw new FError(ErrorCode.FileIsConverting);
        }

        await cloudStorageFilesDAO.update(
            this.DBTransaction,
            {
                payload: {
                    taskUUID: payload.taskUUID!,
                    taskToken: payload.taskToken!,
                    region: payload.region,
                    convertStep:
                        status === "Finished" ? FileConvertStep.Done : FileConvertStep.Failed,
                },
            },
            {
                file_uuid: fileUUID,
            },
        );
    }
}
