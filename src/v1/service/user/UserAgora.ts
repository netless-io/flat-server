import { UserAgoraDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { AgoraLogin } from "../../../constants/Config";

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
        const result = await this.exist();

        if (!result) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public async exist(): Promise<boolean> {
        if (!ServiceUserAgora.enable) {
            return false;
        }

        const result = await UserAgoraDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        return !!result;
    }

    public async name(): Promise<string | null> {
        const result = await UserAgoraDAO().findOne(["user_name"], {
            user_uuid: this.userUUID,
        });

        return result ? result.user_name : null;
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

    private static get enable(): boolean {
        return AgoraLogin.enable;
    }
}
