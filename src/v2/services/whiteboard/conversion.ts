import { createLoggerService } from "../../../logger";
import { ax } from "../../../v1/utils/Axios";
import { Whiteboard } from "../../../constants/Config";
import { WhiteboardTokenService } from "./token";

export class WhiteboardConversionService {
    private readonly logger = createLoggerService<"WhiteboardConversion">({
        serviceName: "WhiteboardConversion",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {}

    public async create(body: CreateParams): Promise<string> {
        const result = await ax.post<TaskCreated>(
            "https://api.netless.link/v5/services/conversion/tasks",
            body,
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

    public async query(uuid: string, type: "static" | "dynamic"): Promise<TaskStatus["status"]> {
        const { data } = await ax.get<TaskStatus>(
            `https://api.netless.link/v5/services/conversion/tasks/${uuid}?type=${type}`,
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
}

type CreateParams = CreateStaticParams | CreateDynamicParams;

interface CreateStaticParams {
    resource: string;
    type: "static";
    /** @default 1.2 */
    scale?: number;
    /** @default 'png' */
    outputFormat?: "png" | "jpg" | "jpeg" | "webp";
    pack?: boolean;
}

interface CreateDynamicParams {
    resource: string;
    type: "dynamic";
    /** @default false */
    preview?: boolean;
    canvasVersion: boolean;
}

interface TaskCreated {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
}

interface TaskStatus {
    uuid: string;
    type: "static" | "dynamic";
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
