import { Type } from "@sinclair/typebox";
import { FastifyRequestTypebox, Response } from "../../../../types/Server";
import { useOnceService } from "../../../service-locator";
import { UserUpdateService } from "../../../services/user/update";
import { successJSON } from "../../internal/utils/response-json";

export const userRenameSchema = {
    body: Type.Object(
        {
            newUserName: Type.String({
                minLength: 1,
                maxLength: 50,
            }),
        },
        {
            additionalProperties: false,
        },
    ),
};

export const userRename = async (
    req: FastifyRequestTypebox<typeof userRenameSchema>,
): Promise<Response> => {
    const complianceText = useOnceService("complianceText", req.ids);
    await complianceText.assertTextNormal(req.body.newUserName);

    await new UserUpdateService(req.ids, req.DBTransaction, req.userUUID).userName(
        req.body.newUserName,
    );

    return successJSON({});
};
