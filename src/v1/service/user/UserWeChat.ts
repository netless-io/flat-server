import { UserWeChatDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { WeChat } from "../../../constants/Config";

export class ServiceUserWeChat {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            unionUUID: string;
            openUUID: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, unionUUID, openUUID } = data;

        return await UserWeChatDAO(t).insert({
            user_uuid: this.userUUID,
            user_name: userName,
            union_uuid: unionUUID,
            open_uuid: openUUID,
        });
    }

    public async assertExist(): Promise<void> {
        const result = await this.exist();

        if (!result) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public async exist(): Promise<boolean> {
        if (!ServiceUserWeChat.enable) {
            return false;
        }

        const result = await UserWeChatDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        return !!result;
    }

    public async name(): Promise<string | null> {
        const result = await UserWeChatDAO().findOne(["user_name"], {
            user_uuid: this.userUUID,
        });

        return result ? result.user_name : null;
    }

    public static async userUUIDByUnionUUID(unionUUID: string): Promise<string | null> {
        const result = await UserWeChatDAO().findOne(["user_uuid"], {
            union_uuid: unionUUID,
        });

        return result ? result.user_uuid : null;
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserWeChatDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }

    private static get enable(): boolean {
        return WeChat.web.enable || WeChat.mobile.enable;
    }
}
