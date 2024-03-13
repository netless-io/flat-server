import { createLoggerService } from "../../../logger";
import { ax } from "../../../v1/utils/Axios";
import { Whiteboard } from "../../../constants/Config";
import { WhiteboardTokenService } from "./token";
import path from "path";

export class WhiteboardConversionService {
    private readonly logger = createLoggerService<"WhiteboardConversion">({
        serviceName: "WhiteboardConversion",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {}

    public async create(resource: string): Promise<string | undefined> {
        const result = await ax.post<TaskCreated>(
            "https://api.netless.link/v5/services/conversion/tasks",
            {
                resource,
                type: "static",
                pack: true,
                canvasVersion: false,
                scale: WhiteboardConversionService.scaleByFileType(resource),
            },
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region: Whiteboard.convertRegion,
                },
            },
        );

        this.logger.debug("create conversion task", {
            WhiteboardConversion: {
                uuid: result.data.uuid,
                status: result.data.status,
                type: result.data.type,
            },
        });

        return result.data.uuid;
    }

    public async query(uuid: string): Promise<TaskStatus["status"]> {
        const { data } = await ax.get<TaskStatus>(
            `https://api.netless.link/v5/services/conversion/tasks/${uuid}?type=static`,
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region: Whiteboard.convertRegion,
                },
            },
        );

        this.logger.debug("query conversion task", {
            WhiteboardConversion: {
                uuid: data.uuid,
                status: data.status,
                type: data.type,
                failedReason: data.failedReason,
                currentStep: data.progress.currentStep,
                totalPageSize: data.progress.totalPageSize,
                convertedPageSize: data.progress.convertedPageSize,
                convertedPercentage: data.progress.convertedPercentage,
            },
        });

        return data.status;
    }

    // see: https://developer.netless.link/server-en/home/server-conversion
    public static scaleByFileType(resource: string): number {
        const extname = path.extname(resource);

        switch (extname) {
            case ".pdf": {
                return 2.4;
            }
            default: {
                return 1.2;
            }
        }
    }
}

interface TaskCreated {
    uuid: string;
    type: "static";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
}

interface TaskStatus {
    uuid: string;
    type: "static";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
    failedReason: string;
    progress: {
        totalPageSize: number;
        convertedPageSize: number;
        convertedPercentage: number;
        convertedFileList: {
            width: number;
            height: number;
            conversionFileUrl: string;
            preview?: string;
        }[];
        currentStep: "Extracting" | "Packaging" | "GeneratingPreview" | "MediaTranscode";
    };
}
