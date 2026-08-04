import { ax } from "../../Axios";
import { ClassroomResourceProfile } from "../../../../classroomResource/Registry";


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
    profile: ClassroomResourceProfile,
): Promise<SendChannelMessageResult> => {
    const headers = {
        "x-agora-uid": uid,
        "x-agora-token": token,
    };

    const response = await ax.post(
        `https://api.agora.io/dev/v2/project/${profile.agora.appId}/rtm/users/${uid}/channel_messages`,
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
