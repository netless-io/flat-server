import { UserDAO } from "../../../dao";
import { Gender } from "../../../constants/Project";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUser {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            avatarURL: string;
            gender?: Gender;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, avatarURL, gender } = data;
        return await UserDAO(t).insert({
            user_name: userName,
            user_uuid: this.userUUID,
            // TODO need upload avatar_url to remote oss server
            avatar_url: avatarURL,
            gender,
            user_password: "",
        });
    }

    public async getNameAndAvatar(): Promise<{
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
        const result = await this.getNameAndAvatar();

        if (result === null) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }

        return result;
    }
}
