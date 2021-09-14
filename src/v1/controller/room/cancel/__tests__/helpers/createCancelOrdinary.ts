import { CancelOrdinary } from "../../Ordinary";
import { ControllerClassParams } from "../../../../../../abstract/controller";
import { Logger } from "../../../../../../logger";

export const createCancelOrdinary = (
    userUUID: string,
    roomUUID: string,
    logger?: Logger<any>,
): CancelOrdinary => {
    return new CancelOrdinary({
        logger: logger || new Logger<any>("test", {}, []),
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
