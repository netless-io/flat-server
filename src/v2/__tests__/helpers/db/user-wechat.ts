import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { userWeChatDAO } from "../../../dao";

export class CreateUserWeChat {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: {
        userUUID: string;
        userName: string;
        unionUUID: string;
        openUUID: string;
    }) {
        await userWeChatDAO.insert(this.t, {
            user_uuid: info.userUUID,
            user_name: info.userName,
            union_uuid: info.unionUUID,
            open_uuid: info.openUUID,
        });
        return info;
    }

    public async quick(info: {
        userUUID?: string;
        userName?: string;
        unionUUID?: string;
        openUUID?: string;
    }) {
        const fullInfo = {
            userUUID: info.userUUID || v4(),
            userName: info.userName || v4().slice(6),
            unionUUID: info.unionUUID || v4(),
            openUUID: info.openUUID || v4(),
        };
        await this.full(fullInfo);
        return fullInfo;
    }
}
