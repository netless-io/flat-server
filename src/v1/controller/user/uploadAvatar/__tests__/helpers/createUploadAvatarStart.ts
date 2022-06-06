import { ControllerClassParams } from "../../../../../../abstract/controller";
import { Region } from "../../../../../../constants/Project";
import { Logger } from "../../../../../../logger";
import { UploadAvatarStart } from "../../Start";

export const createUploadAvatarStart = (
    fileName: string,
    fileSize: number,
    userUUID: string,
): UploadAvatarStart => {
    const logger = new Logger<any>("test", {}, []);

    return new UploadAvatarStart({
        logger,
        req: {
            body: {
                fileName,
                fileSize,
                region: Region.CN_HZ,
            },
            user: {
                userUUID,
            },
        },
        reply: {},
    } as ControllerClassParams);
};
