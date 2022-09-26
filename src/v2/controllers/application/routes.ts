import { Server } from "../../../utils/registryRoutersV2";
import { applicationList, ApplicationListSchema } from "./list";
import { applicationDetail, ApplicationDetailSchema } from "./detail";
import { applicationRevoke, ApplicationRevokeSchema } from "./revoke";

export const applicationRouters = (server: Server): void => {
    server.post("application/list", applicationList, {
        schema: ApplicationListSchema,
    });

    server.post("application/detail", applicationDetail, {
        schema: ApplicationDetailSchema,
    });

    server.post("application/revoke", applicationRevoke, {
        schema: ApplicationRevokeSchema,
    });
};
