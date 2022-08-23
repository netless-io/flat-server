import { createLoggerService } from "../../../logger";
import { ax } from "../../../v1/utils/Axios";
import { WhiteboardTokenService } from "./token";
import { Whiteboard } from "../../../constants/Config";

export class WhiteboardProjectService {
    private readonly logger = createLoggerService<"WhiteboardProject">({
        serviceName: "WhiteboardProject",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {}

    public async create(body: CreateTaskParams): Promise<string> {
        const { data } = await ax.post<TaskCreated>(
            "https://api.netless.link/v5/projector/tasks",
            {
                ...body,
                preview: true,
                pack: false,
            },
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region: Whiteboard.convertRegion,
                },
            },
        );

        this.logger.debug("create projector task", {
            WhiteboardProject: {
                uuid: data.uuid,
                status: data.status,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                convertedPercentage: data.convertedPercentage,
                prefix: data.prefix,
            },
        });

        return data.uuid;
    }

    public query = async (uuid: string): Promise<TaskStatus["status"]> => {
        const { data } = await ax.get<TaskStatus>(
            `https://api.netless.link/v5/projector/tasks/${uuid}`,
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region: Whiteboard.convertRegion,
                },
            },
        );

        this.logger.debug("query projector task", {
            WhiteboardProject: {
                uuid: data.uuid,
                status: data.status,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                convertedPercentage: data.convertedPercentage,
                prefix: data.prefix,
            },
        });

        return data.status;
    };
}

interface CreateTaskParams {
    resource: string;
    preview?: boolean;
    pack?: boolean;
    webhookEndpoint?: string;
    webhookRetry?: number;
    targetStorageDriver?: {
        ak?: string;
        sk?: string;
        token?: string;
        bucket: string;
        path?: string;
        provider: "aliyun" | "qiniu" | "aws" | "qcloud" | "ucloud" | "huaweicloud";
        region: string;
        domain?: string;
    };
}

interface TaskCreated {
    uuid: string;
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
}

interface TaskStatus {
    uuid: string;
    status: "Waiting" | "Converting" | "Finished" | "Fail" | "Abort";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
}
