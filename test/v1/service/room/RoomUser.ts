import { describe } from "mocha";
import { Connection } from "typeorm";
import { orm } from "../../../../src/thirdPartyService/TypeORMService";
import { v4 } from "uuid";
import { RoomUserDAO } from "../../../../src/dao";
import cryptoRandomString from "crypto-random-string";
import { ServiceRoomUser } from "../../../../src/v1/service";
import { expect } from "chai";
import { FilterValue, removeEmptyValue } from "../../../../src/utils/Object";

describe("Service room user", () => {
    let connection: Connection;
    before(async () => {
        connection = await orm();
        await connection.synchronize(true);
    });
    after(() => connection.close());

    it("remove self", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        await RoomUserDAO().insert({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
        });

        const serviceRoomUser = new ServiceRoomUser(roomUUID, userUUID);

        await serviceRoomUser.removeSelf();

        const result = await RoomUserDAO().count({
            user_uuid: userUUID,
        });

        expect(result).eq(0);
    });

    it("add self", async () => {
        const [roomUUID, userUUID] = [v4(), v4()];

        const serviceRoomUser = new ServiceRoomUser(roomUUID, userUUID);

        await serviceRoomUser.addSelf();

        const result = await RoomUserDAO().find(["room_uuid"], {
            user_uuid: userUUID,
        });

        expect(result).length(1);

        expect(removeEmptyValue(result[0], [FilterValue.UNDEFINED])).deep.eq({
            room_uuid: roomUUID,
        });
    });
});
