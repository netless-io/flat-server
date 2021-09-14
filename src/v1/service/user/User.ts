import { UserDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUser {
    constructor(private readonly userUUID: string) {}

    public async nameAndAvatar(): Promise<{
        userName: string;
        avatarURL: string;
    } | null> {
        const result = await UserDAO().findOne(["user_name", "avatar_url"], {
            user_uuid: this.userUUID,
        });

        if (result) {
            return {
                userName: result.user_name,
                avatarURL: result.avatar_url,
            };
        }

        return null;
    }

    public async assertGetNameAndAvatar(): Promise<{
        userName: string;
        avatarURL: string;
    }> {
        const result = await this.nameAndAvatar();

        if (result === null) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }

        return result;
    }
}
