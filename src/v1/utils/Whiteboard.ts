import { ax } from "./Axios";
import { shuntCreateRoomURL } from "./WhiteboardURL";
import { createWhiteboardSDKToken } from "../../utils/NetlessToken";
import { AxiosResponse } from "axios";

/**
 * whiteboard create room api
 * @param {string} name - room name (max length: 2048)
 * @param {number} limit - (default: 0 = no limit)
 * @return {string} whiteboard room uuid, not room model's room_uuid
 */
export const whiteboardCreateRoom = async (name: string, limit = 0): Promise<string> => {
    const {
        data: { uuid },
    } = await ax.post<Room>(
        shuntCreateRoomURL,
        {
            name,
            isRecord: true,
            limit,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                // TODO region: 'cn-hz',
            },
        },
    );

    return uuid;
};

export const whiteboardBanRoom = async (uuid: string): Promise<AxiosResponse<Room>> => {
    return await ax.patch<Room>(
        `${shuntCreateRoomURL}/${uuid}`,
        {
            isBan: true,
        },
        {
            headers: {
                token: createWhiteboardSDKToken(),
                // TODO region: 'cn-hz',
            },
        },
    );
};

interface Room {
    uuid: string;
    name: string;
    teamUUID: string;
    isRecord: boolean;
    isBan: boolean;
    limit: number;
    createdAt: string;
}
