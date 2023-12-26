import { Agora } from "../../../../constants/Config";
import { ax } from "../../Axios";

const baseUrl = `https://api.agora.io/dev/v2/project/${Agora.appId}`;

export interface SendChannelMessageResult {
    code: "message_sent";
    request_id: string;
    result: "success" | "failed";
}

// https://docs.agora.io/en/signaling/reference/restful-messaging?platform=web#sends-channel-message-api-post
export const agoraSendChannelMessage = async (
    uid: string,
    token: string,
    channel: string,
    payload: string,
): Promise<SendChannelMessageResult> => {
    const headers = {
        "x-agora-uid": uid,
        "x-agora-token": token,
    };

    const response = await ax.post(
        `${baseUrl}/rtm/users/${uid}/channel_messages`,
        {
            channel_name: channel,
            enable_historical_messaging: false,
            payload,
        },
        {
            headers,
        },
    );

    return response.data;
};
