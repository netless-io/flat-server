import { JoinRoom } from "../..";
import { Logger } from "../../../../../../logger";

export const createJoinRoom = (roomUUID: string, userUUID: string): JoinRoom => {
    const logger = new Logger<any>("test", {}, []);
    return new JoinRoom({
        logger,
        req: {
            body: {
                uuid: roomUUID,
            },
            user: {
                userUUID,
            },
        },
        reply: {},
    } as any);
};
