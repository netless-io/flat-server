import { v4 } from "uuid";
import { EntityManager } from "typeorm";
import { userDAO } from "../../../dao";

export class CreateUser {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        userUUID: string;
        userName: string;
        userPassword: string;
        avatarURL: string;
    }) {
        await userDAO.insert(this.t, {
            user_uuid: info.userUUID,
            user_name: info.userName,
            user_password: info.userPassword,
            avatar_url: info.avatarURL,
        });

        return info;
    }

    public async quick(
        info: {
            userUUID?: string;
            userName?: string;
            userPassword?: string;
            avatarURL?: string;
        } = {},
    ) {
        const fullInfo = {
            userUUID: info.userUUID || v4(),
            userName: info.userName || v4(),
            userPassword: info.userPassword ?? v4(),
            avatarURL: info.avatarURL || v4(),
        };

        await this.full(fullInfo);

        return fullInfo;
    }

    public async fixedName(userName: string) {
        const info = {
            userUUID: v4(),
            userName,
            userPassword: v4(),
            avatarURL: v4(),
        };

        await this.full(info);

        return info;
    }
    public async fixedUUID(userUUID: string) {
        const info = {
            userUUID,
            userName: v4(),
            userPassword: v4(),
            avatarURL: v4(),
        };

        await this.full(info);

        return info;
    }
}
