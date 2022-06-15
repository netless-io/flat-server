import { UserWeChatDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

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
        const result = await UserWeChatDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public async exist(): Promise<boolean> {
        const result = await UserWeChatDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        return !!result;
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
}
