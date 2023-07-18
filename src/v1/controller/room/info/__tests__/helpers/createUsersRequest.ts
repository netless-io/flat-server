import { UserInfo } from "../../Users";
import { Logger } from "../../../../../../logger";
import { ControllerClassParams } from "../../../../../../abstract/controller";
import { v4 } from "uuid";
import { RoomDAO, RoomUserDAO, UserDAO } from "../../../../../../dao";
import { RoomStatus, RoomType } from "../../../../../../model/room/Constants";
import { Region } from "../../../../../../constants/Project";
import cryptoRandomString from "crypto-random-string";

export const createUsersRequest = (
    body: {
        roomUUID: string;
        usersUUID?: string[];
    },
    userUUID: string,
): UserInfo => {
    const logger = new Logger<any>("test", {}, []);

    return new UserInfo({
        logger,
        req: {
            body: body,
            user: {
                userUUID,
            },
        },
        reply: {},
    } as ControllerClassParams);
};

export const createRoom = async (
    ownerUUID: string,
    roomUUID: string,
    roomStatus: RoomStatus = RoomStatus.Stopped,
): Promise<void> => {
    await RoomDAO().insert({
        room_uuid: roomUUID,
        periodic_uuid: "",
        room_status: roomStatus,
        begin_time: new Date(),
        end_time: new Date(),
        title: "test",
        room_type: RoomType.BigClass,
        region: Region.GB_LON,
        owner_uuid: ownerUUID,
        whiteboard_room_uuid: v4(),
    });
};

export const createRoomUser = async (roomUUID: string, count: number): Promise<string[]> => {
    const usersUUID = new Array(count).fill(null).map(() => v4());

    const commands: Promise<any>[] = [];

    for (const userUUID of usersUUID) {
        commands.push(
            UserDAO().insert({
                user_uuid: userUUID,
                user_name: "test_name",
                avatar_url: "xxx",
                user_password: "",
            }),
            RoomUserDAO().insert({
                user_uuid: userUUID,
                room_uuid: roomUUID,
                rtc_uid: cryptoRandomString({ length: 6, type: "numeric" }),
            }),
        );
    }

    await Promise.all(commands);

    return usersUUID;
};
