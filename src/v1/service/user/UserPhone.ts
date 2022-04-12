import { EntityManager, InsertResult } from "typeorm";
import { UserPhoneDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";

export class ServiceUserPhone {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            userName: string;
            phone: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { userName, phone } = data;

        return await UserPhoneDAO(t).insert({
            user_uuid: this.userUUID,
            user_name: userName,
            phone_number: phone,
        });
    }

    public async assertExist(): Promise<void> {
        const result = await UserPhoneDAO().findOne(["id"], {
            user_uuid: this.userUUID,
        });

        if (result === undefined) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public static async userUUIDByPhone(phone: string): Promise<string | null> {
        const result = await UserPhoneDAO().findOne(["user_uuid"], {
            phone_number: String(phone),
        });

        return result ? result.user_uuid : null;
    }
}
