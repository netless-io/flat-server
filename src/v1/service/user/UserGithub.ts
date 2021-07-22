import { UserGithubDAO } from "../../../dao";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUserGithub {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            unionUUID: string;
            accessToken: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, unionUUID, accessToken } = data;

        return await UserGithubDAO(t).insert({
            user_uuid: this.userUUID,
            user_name: userName,
            union_uuid: unionUUID,
            access_token: accessToken,
        });
    }

    public async assertExist(): Promise<void> {
        const result = await UserGithubDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public updateAccessToken(accessToken: string, t?: EntityManager): Promise<UpdateResult> {
        return UserGithubDAO(t).update(
            {
                access_token: accessToken,
            },
            {
                user_uuid: this.userUUID,
            },
        );
    }

    public static async basicUUIDInfoByUnionUUID(
        unionUUID: string,
    ): Promise<{
        userUUID: string;
        accessToken: string;
    } | null> {
        const result = await UserGithubDAO().findOne(["user_uuid", "access_token"], {
            union_uuid: String(unionUUID),
        });

        if (result) {
            return {
                userUUID: result.user_uuid,
                accessToken: result.access_token,
            };
        }

        return null;
    }
}
