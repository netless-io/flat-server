import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";
import { RoomUserDAO } from "../../../dao";
import { InsertResult } from "typeorm/query-builder/result/InsertResult";
import cryptoRandomString from "crypto-random-string";

export class ServiceRoomUser {
    constructor(private readonly roomUUID: string, private readonly userUUID: string) {}

    public removeSelf(t?: EntityManager): Promise<UpdateResult> {
        return RoomUserDAO(t).remove({
            room_uuid: this.roomUUID,
            user_uuid: this.userUUID,
        });
    }

    public async addSelf(t?: EntityManager): Promise<InsertResult> {
        return await RoomUserDAO(t).insert({
            room_uuid: this.roomUUID,
            user_uuid: this.userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
            grade: -1,
        });
    }
}
