import { getRTCToken } from "../../../utils/AgoraToken";

export const getCloudRecordData = async <T extends boolean>(
    roomUUID: string,
    hasToken: T,
): Promise<T extends true ? CloudRecordDataToken : CloudRecordData> => {
    if (hasToken === true) {
        // @ts-ignore
        return {
            uid: "1",
            cname: roomUUID,
            token: await getRTCToken(roomUUID, 1),
        };
    }

    // @ts-ignore
    return {
        uid: "1",
        cname: roomUUID,
    };
};

interface CloudRecordData {
    uid: "1";
    cname: string;
}

interface CloudRecordDataToken extends CloudRecordData {
    token: string;
}
