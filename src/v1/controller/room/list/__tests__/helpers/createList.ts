import { List } from "../../index";
import { Logger } from "../../../../../../logger";
import { ControllerClassParams } from "../../../../../../abstract/controller";

export const createList = (type: string, userUUID: string): List => {
    const logger = new Logger<any>("test", {}, []);

    return new List({
        logger,
        req: {
            body: {},
            query: {
                page: 1,
            },
            params: {
                type,
            },
            user: {
                userUUID,
            },
        },
        reply: {},
    } as ControllerClassParams);
};
