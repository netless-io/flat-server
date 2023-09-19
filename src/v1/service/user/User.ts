import { UserDAO } from "../../../dao";
import { Gender } from "../../../constants/Project";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { generateAvatar } from "../../../utils/Avatar";

export class ServiceUser {
    constructor(private readonly userUUID: string) {}

    public async hasPassword(): Promise<boolean> {
        return await ServiceUser.hasPassword(this.userUUID);
    }

    public static async hasPassword(userUUID: string): Promise<boolean> {
        const result = await UserDAO().findOne(["user_password"], {
            user_uuid: userUUID,
        });

        return Boolean(result && result.user_password);
    }

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
                avatarURL: result.avatar_url || generateAvatar(this.userUUID),
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

    public async updateAvatar(avatarURL: string, t?: EntityManager): Promise<UpdateResult> {
        return await UserDAO(t).update(
            {
                avatar_url: avatarURL,
            },
            {
                user_uuid: this.userUUID,
            },
        );
    }

    public async updateName(userName: string, t?: EntityManager): Promise<UpdateResult> {
        return await UserDAO(t).update(
            {
                user_name: userName,
            },
            {
                user_uuid: this.userUUID,
            },
        );
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }
}
