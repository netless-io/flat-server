import { ax } from "./Axios";
import { shuntCreateRoomURL } from "./WhiteboardURL";
import { createWhiteboardSDKToken } from "../../utils/NetlessToken";

const makeFetch = async <T>(url: string, body: unknown = undefined): Promise<T> => {
    const response = await ax.post<T>(url, body, {
        headers: {
            token: createWhiteboardSDKToken(),
            // TODO region: 'cn-hz',
        },
    });
    return response.data;
};

/**
 * whiteboard create room api
 * @param {string} name - room name (max length: 2048)
 * @param {number} limit - (default: 0 = no limit)
 * @return {string} whiteboard room uuid, not room model's room_uuid
 */
export const whiteboardCreateRoom = async (name: string, limit = 0): Promise<string> => {
    const { uuid } = await makeFetch<Room>(shuntCreateRoomURL, {
        name,
        isRecord: true,
        limit,
    });

    return uuid;
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
