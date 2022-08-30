import { v4 } from "uuid";
import { EntityManager } from "typeorm";
import { userDAO } from "../../../dao";

export class CreateUser {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        userUUID: string;
        userName: string;
        userPassword: string;
        avatarUrl: string;
    }) {
        await userDAO.insert(this.t, {
            user_uuid: info.userUUID,
            user_name: info.userName,
            user_password: info.userPassword,
            avatar_url: info.avatarUrl,
        });
    }

    public async quick() {
        const info = {
            userUUID: v4(),
            userName: v4(),
            userPassword: v4(),
            avatarUrl: v4(),
        };

        await this.full(info);

        return info;
    }

    public async fixedName(userName: string) {
        const info = {
            userUUID: v4(),
            userName,
            userPassword: v4(),
            avatarUrl: v4(),
        };

        await this.full(info);

        return info;
    }
}
