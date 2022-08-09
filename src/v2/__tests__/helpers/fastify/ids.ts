import { v4 } from "uuid";

export const ids = (): IDS => {
    return {
        reqID: v4(),
        sesID: v4(),
    };
};
