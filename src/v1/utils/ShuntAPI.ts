import { Netless } from "../../Constants";
import { ax } from "./Axios";
import { shuntCreateRoomURL, shuntRequestRoomTokenURL } from "./ShuntURL";

const makeFetch = async <T>(url: string, body: unknown = undefined): Promise<T> => {
    const response = await ax.post<T>(url, body, {
        headers: {
            token: Netless.SDK_TOKEN,
            // TODO region: 'cn-hz',
        },
    });
    return response.data;
};

/**
 * shunt create room api
 * @param {string} name - room name (max length: 2048)
 * @param {number} limit - (default: 0 = no limit)
 * @return {{uuid, token}} room info for {@link https://developer.netless.link/javascript-en/home/construct-room-and-player#construct-room-object `whiteWebSdk.joinRoom()`}
 */
export const shuntCreateRoom = async (name: string, limit = 0): Promise<CreateRoomResult> => {
    const { uuid } = await makeFetch<Room>(shuntCreateRoomURL, { name, limit });

    const requestTokenUrl = shuntRequestRoomTokenURL(uuid);
    const token = await makeFetch<string>(requestTokenUrl, { lifespan: 0, role: "admin" });

    return { uuid, token };
};

type CreateRoomResult = {
    /**
     * shunt's room uuid, not room model's room_uuid
     */
    uuid: string;
    token: string;
};

type Room = {
    uuid: string;
    name: string;
    teamUUID: string;
    isRecord: boolean;
    isBan: boolean;
    limit: 0;
    createdAt: string;
};
