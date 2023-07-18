import { Logger } from "../../../../../../logger";
import { CancelOrdinary } from "../../../cancel/Ordinary";

export const createCancel = (roomUUID: string, userUUID: string): CancelOrdinary => {
    const logger = new Logger<any>("test", {}, []);
    return new CancelOrdinary({
        logger,
        req: {
            body: {
                roomUUID,
            },
            user: {
                userUUID,
            },
        },
        reply: {},
    } as any);
};
