import { CreateOrdinary, RequestType } from "../../Ordinary";
import { ControllerClassParams } from "../../../../../../abstract/controller";
import { Logger } from "../../../../../../logger";

export const createOrdinaryFn = (userUUID: string, body: RequestType["body"]): CreateOrdinary => {
    const logger = new Logger<any>("test", {}, []);

    return new CreateOrdinary({
        logger,
        req: {
            body,
            user: {
                userUUID,
            },
        },
        reply: {},
    } as ControllerClassParams);
};
