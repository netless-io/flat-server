import { UserWeChatDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUserWeChat {
    constructor(private readonly userUUID: string) {}

    public async assertExist(): Promise<void> {
        const result = await UserWeChatDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }
}
