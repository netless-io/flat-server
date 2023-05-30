import { Server } from "../../../utils/registryRoutersV2";
import { tempPhotoUploadStart, tempPhotoUploadStartSchema } from "./upload/start";
import { tempPhotoUploadFinish, tempPhotoUploadFinishSchema } from "./upload/finish";

export const tempPhotoRouters = (server: Server): void => {
    server.post("temp-photo/upload/start", tempPhotoUploadStart, {
        schema: tempPhotoUploadStartSchema,
    });

    server.post("temp-photo/upload/finish", tempPhotoUploadFinish, {
        schema: tempPhotoUploadFinishSchema,
    });
};
