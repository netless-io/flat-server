import test from "ava";
import { v4 } from "uuid";
import { Status } from "../../../../constants/Project";
import { FError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";
import { RoomStatus } from "../../../../model/room/Constants";
import RedisService from "../../../../thirdPartyService/RedisService";
import { RedisKey } from "../../../../utils/Redis";
import { roomDAO, roomUserDAO, userDAO, userPhoneDAO, userWeChatDAO } from "../../../dao";
import { testService } from "../../../__tests__/helpers/db";
import { useTransaction } from "../../../__tests__/helpers/db/query-runner";
import { initializeDataSource } from "../../../__tests__/helpers/db/test-hooks";
import { randomPhoneNumber } from "../../../__tests__/helpers/db/user-phone";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { MessageExpirationSecond, UserRebindPhoneService } from "../rebind-phone";

const namespace = "v2.services.user.rebind-phone";
initializeDataSource(test, namespace);

test(`${namespace} - user already bind phone in send message`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone } = testService(t);

    const userInfo = await createUser.quick();
    const userPhoneInfo = await createUserPhone.quick(userInfo);

    await ava.throwsAsync(
        () =>
            new UserRebindPhoneService(ids(), t, userInfo.userUUID).sendMessage(
                userPhoneInfo.phoneNumber,
            ),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.SMSAlreadyExist}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user has joined room in rebind`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone, createRoom, createRoomJoin } = testService(t);

    const userInfo = await createUser.quick();
    const roomInfo = await createRoom.quick({
        ownerUUID: userInfo.userUUID,
        roomStatus: RoomStatus.Started,
    });
    await createRoomJoin.quick({ ...roomInfo, ...userInfo });

    const targetUserInfo = await createUser.quick();
    const targetUserPhoneInfo = await createUserPhone.quick(targetUserInfo);

    RedisService.set(
        RedisKey.phoneBinding(targetUserPhoneInfo.phoneNumber),
        "666666",
        MessageExpirationSecond,
    );

    await new UserRebindPhoneService(ids(), t, userInfo.userUUID).rebind(
        targetUserPhoneInfo.phoneNumber,
        666666,
        async () => "",
    );

    const room = await roomDAO.findOne(t, ["room_status"], { room_uuid: roomInfo.roomUUID });
    ava.is(room?.room_status, RoomStatus.Stopped);

    const join = await roomUserDAO.findOne(t, ["id"], { user_uuid: userInfo.userUUID });
    ava.is(join, null);

    await releaseRunner();
});

test(`${namespace} - user not found in rebind`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone } = testService(t);

    await ava.throwsAsync(
        () =>
            new UserRebindPhoneService(ids(), t, v4()).rebind(
                randomPhoneNumber(),
                666666,
                async () => "",
            ),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserNotFound}`,
        },
    );

    const userInfo = await createUser.quick();
    const userPhoneInfo = await createUserPhone.quick(userInfo);

    await ava.throwsAsync(
        () =>
            new UserRebindPhoneService(ids(), t, userInfo.userUUID).rebind(
                randomPhoneNumber(),
                666666,
                async () => "",
            ),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.SMSAlreadyBinding}`,
        },
    );

    await userPhoneDAO.delete(t, { phone_number: userPhoneInfo.phoneNumber });

    await ava.throwsAsync(
        () =>
            new UserRebindPhoneService(ids(), t, userInfo.userUUID).rebind(
                randomPhoneNumber(),
                666666,
                async () => "",
            ),
        {
            instanceOf: FError,
            message: `${Status.Failed}: ${ErrorCode.UserNotFound}`,
        },
    );

    await releaseRunner();
});

test(`${namespace} - user rebind success`, async ava => {
    const { t, releaseRunner } = await useTransaction();
    const { createUser, createUserPhone, createUserWeChat } = testService(t);

    const userInfo = await createUser.quick();
    const oldUserWeChatInfo = await createUserWeChat.quick(userInfo);

    const targetUserInfo = await createUser.quick();
    const targetUserPhoneInfo = await createUserPhone.quick(targetUserInfo);

    RedisService.set(
        RedisKey.phoneBinding(targetUserPhoneInfo.phoneNumber),
        "666666",
        MessageExpirationSecond,
    );

    const result = await new UserRebindPhoneService(ids(), t, userInfo.userUUID).rebind(
        targetUserPhoneInfo.phoneNumber,
        666666,
        async () => "",
    );

    ava.deepEqual(result.rebind, {
        wechat: 0,
        github: -1,
        apple: -1,
        email: -1,
        agora: -1,
        google: -1,
    });

    const newUserWeChatInfo = await userWeChatDAO.findOne(t, ["union_uuid", "open_uuid"], {
        user_uuid: targetUserInfo.userUUID,
    });

    ava.is(newUserWeChatInfo?.open_uuid, oldUserWeChatInfo.openUUID);
    ava.is(newUserWeChatInfo?.union_uuid, oldUserWeChatInfo.unionUUID);

    const userShouldDelete = await userDAO.findOne(t, ["id"], { user_uuid: userInfo.userUUID });
    ava.is(userShouldDelete, null);

    await releaseRunner();
});
