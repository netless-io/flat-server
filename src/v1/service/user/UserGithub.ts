import { UserGithubDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUserGithub {
    constructor(private readonly userUUID: string) {}

    public async assertExist(): Promise<void> {
        const result = await UserGithubDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }
}
