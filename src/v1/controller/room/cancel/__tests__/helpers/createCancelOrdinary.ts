import { CancelOrdinary } from "../../Ordinary";
import { ControllerClassParams } from "../../../../../../abstract/controller";
import { Logger } from "../../../../../../logger";

export const createCancelOrdinary = (userUUID: string, roomUUID: string): CancelOrdinary => {
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
    } as ControllerClassParams);
};
