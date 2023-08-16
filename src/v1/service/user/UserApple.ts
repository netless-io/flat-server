import { UserAppleDAO } from "../../../dao";
import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { Apple } from "../../../constants/Config";

export class ServiceUserApple {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            unionUUID: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, unionUUID } = data;

        return await UserAppleDAO(t).insert({
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
        if (!ServiceUserApple.enable) {
            return false;
        }

        const result = await UserAppleDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        return !!result;
    }

    public async name(): Promise<string | null> {
        const result = await UserAppleDAO().findOne(["user_name"], {
            user_uuid: this.userUUID,
        });

        return result ? result.user_name : null;
    }

    public static async userUUIDByUnionUUID(unionUUID: string): Promise<string | null> {
        const result = await UserAppleDAO().findOne(["user_uuid"], {
            union_uuid: String(unionUUID),
        });

        return result ? result.user_uuid : null;
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserAppleDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }

    private static get enable(): boolean {
        return Apple.enable;
    }
}
