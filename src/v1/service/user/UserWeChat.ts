import { UserWeChatDAO } from "../../../dao";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
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

    public static async getUserUUIDByUnionUUID(unionUUID: string): Promise<string | null> {
        const result = await UserWeChatDAO().findOne(["user_uuid"], {
            union_uuid: unionUUID,
        });

        if (result) {
            return result.user_uuid;
        }

        return null;
    }
}
