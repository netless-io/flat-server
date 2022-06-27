import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserModel } from "../../../../model/user/User";
import { v4 } from "uuid";

export class CreateUser {
    public static async full(info: {
        userUUID: string;
        userName: string;
        userPassword: string;
        avatarUrl: string;
    }) {
        await dataSource.getRepository(UserModel).insert({
            user_uuid: info.userUUID,
            user_name: info.userName,
            user_password: info.userPassword,
            avatar_url: info.avatarUrl,
        });
    }

    public static async quick() {
        const info = {
            userUUID: v4(),
            userName: v4(),
            userPassword: v4(),
            avatarUrl: v4(),
        };

        await CreateUser.full(info);

        return info;
    }

    public static async fixedName(userName: string) {
        const info = {
            userUUID: v4(),
            userName,
            userPassword: v4(),
            avatarUrl: v4(),
        };

        await CreateUser.full(info);

        return info;
    }
}
