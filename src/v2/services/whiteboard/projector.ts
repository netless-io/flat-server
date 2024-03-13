import { createLoggerService } from "../../../logger";
import { ax } from "../../../v1/utils/Axios";
import { WhiteboardTokenService } from "./token";
import { Whiteboard } from "../../../constants/Config";
import { determineType } from "../../../v1/controller/cloudStorage/convert/Utils";
import { WhiteboardConversionService } from "./conversion";

export class WhiteboardProjectorService {
    private readonly logger = createLoggerService<"WhiteboardProject">({
        serviceName: "WhiteboardProject",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {}

    public async create(resource: string): Promise<string | undefined> {
        const { data } = await ax.post<TaskCreated>(
            "https://api.netless.link/v5/projector/tasks",
            {
                resource,
                type: determineType(resource),
                scale: WhiteboardConversionService.scaleByFileType(resource),
                preview: true,
                imageCompressionLevel: 1,
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
                type: data.type,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                convertedPercentage: data.convertedPercentage,
                prefix: data.prefix,
                pageCount: data.pageCount,
            },
        });

        return data.status;
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
    type: "dynamic" | "static";
    errorCode?: string;
    errorMessage?: string;
    convertedPercentage?: number;
    prefix?: string;
    pageCount?: number;
    previews?: { [page: number]: string };
    note?: string;
    images?: { [page: number]: { width: number; height: number; url: string } };
}
