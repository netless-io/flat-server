import { DeleteResult, EntityManager, InsertResult } from "typeorm";
import { UserEmailDAO } from "../../../dao";
import { ControllerError } from "../../../error/ControllerError";
import { ErrorCode } from "../../../ErrorCode";
import { EmailSMS } from "../../../constants/Config";

export class ServiceUserEmail {
    constructor(private readonly userUUID: string) {}

    public async create(
        data: {
            email: string;
        },
        t?: EntityManager,
    ): Promise<InsertResult> {
        const { email } = data;

        return await UserEmailDAO(t).insert({
            user_uuid: this.userUUID,
            user_email: email,
        });
    }

    public async exist(): Promise<boolean> {
        return await ServiceUserEmail.exist(this.userUUID);
    }

    public static async exist(userUUID: string): Promise<boolean> {
        if (!ServiceUserEmail.enable) {
            return false;
        }

        const result = await UserEmailDAO().findOne(["id"], {
            user_uuid: userUUID,
        });

        return !!result;
    }

    public async email(): Promise<string | null> {
        const result = await UserEmailDAO().findOne(["user_email"], {
            user_uuid: this.userUUID,
        });

        return result ? this.desensitiveEmail(result.user_email) : null;
    }

    private desensitiveEmail(email: string): string {
        const at = email.indexOf("@");
        if (at < 0) return email.slice(0, -3) + "***";

        const name = email.slice(0, at);
        const suffix = email.slice(at);
        return name.slice(0, -3) + "***" + suffix;
    }

    public async existEmail(email: string): Promise<boolean> {
        return await ServiceUserEmail.existEmail(email);
    }

    public static async existEmail(email: string): Promise<boolean> {
        if (!ServiceUserEmail.enable) {
            return false;
        }

        const result = await UserEmailDAO().findOne(["id"], {
            user_email: email,
        });

        return !!result;
    }

    public async assertExist(): Promise<void> {
        const result = await this.exist();

        if (!result) {
            throw new ControllerError(ErrorCode.UserNotFound);
        }
    }

    public static async userUUIDByEmail(email: string): Promise<string | null> {
        const result = await UserEmailDAO().findOne(["user_uuid"], {
            user_email: email,
        });

        return result ? result.user_uuid : null;
    }

    public async physicalDeletion(t?: EntityManager): Promise<DeleteResult> {
        return await UserEmailDAO(t).physicalDeletion({
            user_uuid: this.userUUID,
        });
    }

    private static get enable(): boolean {
        return EmailSMS.enable;
    }
}
