import { EntityManager, InsertResult } from "typeorm";
import { UserSensitiveDAO } from "../../../dao";
import { SensitiveType } from "../../../model/user/Constants";

export class ServiceUserSensitive {
    constructor(private readonly userUUID: string) {}

    public async phone(
        data: {
            phone: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        return await UserSensitiveDAO(t).insert({
            user_uuid: this.userUUID,
            type: SensitiveType.Phone,
            content: this.desensitivePhone(data.phone),
        });
    }

    private desensitivePhone(phone: string): string {
        return phone.slice(0, 3) + "*******" + phone.slice(-1);
    }

    public async avatar(
        data: {
            avatarURL: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        return await UserSensitiveDAO(t).insert({
            user_uuid: this.userUUID,
            type: SensitiveType.Avatar,
            content: data.avatarURL,
        });
    }
}
