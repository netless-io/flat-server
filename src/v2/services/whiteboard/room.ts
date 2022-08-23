import { createLoggerService } from "../../../logger";
import { Region } from "../../../constants/Project";
import { ax } from "../../../v1/utils/Axios";
import { WhiteboardTokenService } from "./token";

export class WhiteboardRoomService {
    private readonly logger = createLoggerService<"WhiteboardRoom">({
        serviceName: "WhiteboardRoom",
        ids: this.ids,
    });

    public constructor(private readonly ids: IDS) {}

    public async create(region: Region, limit = 0): Promise<string> {
        const {
            data: { uuid },
        } = await ax.post<Room>(
            "https://api.netless.link/v5/rooms",
            {
                isRecord: true,
                limit,
            },
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region,
                },
            },
        );

        return uuid;
    }

    public ban = async (region: Region, uuid: string): Promise<void> => {
        const { data } = await ax.patch<Room>(
            `https://api.netless.link/v5/rooms/${uuid}`,
            {
                isBan: true,
            },
            {
                headers: {
                    token: WhiteboardTokenService.createSDK(),
                    region,
                },
            },
        );

        this.logger.debug("ban whiteboard room", {
            WhiteboardRoom: {
                uuid: data.uuid,
                name: data.name,
                teamUUID: data.teamUUID,
                isRecord: data.isRecord,
                isBan: data.isBan,
                limit: data.limit,
                createdAt: data.createdAt,
            },
        });
    };
}

interface Room {
    uuid: string;
    name: string;
    teamUUID: string;
    isRecord: boolean;
    isBan: boolean;
    limit: number;
    createdAt: string;
}
