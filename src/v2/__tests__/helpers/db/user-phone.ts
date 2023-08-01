import { EntityManager } from "typeorm";
import { v4 } from "uuid";
import { userPhoneDAO } from "../../../dao";

export class CreateUserPhone {
    public constructor(private readonly t: EntityManager) {}

    public async full(info: { userUUID: string; userName: string; phoneNumber: string }) {
        await userPhoneDAO.insert(this.t, {
            user_uuid: info.userUUID,
            user_name: info.userName,
            phone_number: info.phoneNumber,
        });
        return info;
    }

    public async quick(info: { userUUID?: string; userName?: string; phoneNumber?: string }) {
        const fullInfo = {
            userUUID: info.userUUID || v4(),
            userName: info.userName || v4().slice(6),
            phoneNumber: info.phoneNumber || randomPhoneNumber(),
        };
        await this.full(fullInfo);
        return fullInfo;
    }
}

export function randomPhoneNumber() {
    const prefixArray = ["130", "131", "132", "133", "135", "137", "138", "170", "187", "189"];
    const i = parseInt(String(10 * Math.random()));
    let prefix = prefixArray[i];
    for (let j = 0; j < 8; j++) {
        prefix = prefix + String(Math.floor(Math.random() * 10));
    }
    return prefix;
}
