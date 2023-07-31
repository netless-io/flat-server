import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { userEmailDAO } from "../../../dao";

export class CreateUserEmail {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: { userUUID: string; userEmail: string }) {
        await userEmailDAO.insert(this.t, {
            user_uuid: info.userUUID,
            user_email: info.userEmail,
        });
        return info;
    }

    public async quick(info: { userUUID?: string; userEmail?: string }) {
        const fullInfo = {
            userUUID: info.userUUID || v4(),
            userEmail: info.userEmail || `${v4()}@test.com`,
        };
        await this.full(fullInfo);
        return fullInfo;
    }
}
