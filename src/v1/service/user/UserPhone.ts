import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { UserPhoneDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { PhoneSMS } from "../../../constants/Config";

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

    public async exist(): Promise<boolean> {
        return await ServiceUserPhone.exist(this.userUUID);
    }

    public static async exist(userUUID: string): Promise<boolean> {
        if (!ServiceUserPhone.enable) {
            return false;
        }

        const result = await UserPhoneDAO().findOne(["id"], {
            user_uuid: userUUID,
        });

        return !!result;
    }

    public async phoneNumber(): Promise<string | null> {
        const result = await UserPhoneDAO().findOne(["phone_number"], {
            user_uuid: this.userUUID,
        });

        return result ? this.desensitivePhone(result.phone_number) : null;
    }

    private desensitivePhone(phone: string): string {
        return phone.slice(0, -8) + "****" + phone.slice(-4);
    }

    public async existPhone(phone: string): Promise<boolean> {
        return await ServiceUserPhone.existPhone(phone);
    }

    public static async existPhone(phone: string): Promise<boolean> {
        if (!ServiceUserPhone.enable) {
            return false;
        }

        const result = await UserPhoneDAO().findOne(["id"], {
            phone_number: phone,
        });

        return !!result;
    }

    public async assertExist(): Promise<void> {
        const result = await this.exist();

        if (!result) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public static async userUUIDByPhone(phone: string): Promise<string | null> {
        const result = await UserPhoneDAO().findOne(["user_uuid"], {
            phone_number: String(phone),
        });

        return result ? result.user_uuid : null;
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserPhoneDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }

    private static get enable(): boolean {
        return PhoneSMS.enable;
    }
}
