import { UserAgoraDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUserAgora {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            unionUUID: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, unionUUID } = data;

        return await UserAgoraDAO(t).insert({
            user_uuid: this.userUUID,
            user_name: userName,
            union_uuid: unionUUID,
        });
    }

    public async assertExist(): Promise<void> {
        const result = await UserAgoraDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public static async userUUIDByUnionUUID(unionUUID: string): Promise<string | null> {
        const result = await UserAgoraDAO().findOne(["user_uuid"], {
            union_uuid: String(unionUUID),
        });

        return result ? result.user_uuid : null;
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserAgoraDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }
}
