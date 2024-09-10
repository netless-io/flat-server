import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { RoomUserDAO, UserAgreementDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ServiceUserAgreement } from "../UserAgreement";
import cryptoRandomString from "crypto-random-string";
import { RoomUserModel } from "../../../../model/room/RoomUser";
import { UserAgreementModel } from "../../../../model/user/Agreement";

const namespace = "[service][service-user][service-user-agreement]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - set user collect agreement`, async ava => {

    const userUUID = v4();
    const serviceUserAgreement = new ServiceUserAgreement(userUUID);

    await serviceUserAgreement.set(true);

    let result = await UserAgreementDAO().findOne(["is_agree_collect_data"], {
        user_uuid: userUUID,
    });

    ava.not(result, undefined);

    ava.is(result?.is_agree_collect_data, true);

    await serviceUserAgreement.set(false);

    result = await UserAgreementDAO().findOne(["is_agree_collect_data"], {
        user_uuid: userUUID,
    });

    ava.is(result?.is_agree_collect_data, false);
});

test(`${namespace} - has agree collect data`, async ava => {
    const userUUID = v4();

    await UserAgreementDAO().insert({
        user_uuid: userUUID,
        is_agree_collect_data: true,
    });

    const serviceUserAgreement = new ServiceUserAgreement(userUUID);

    const bol = await serviceUserAgreement.hasCollectData();

    ava.is(bol, true);

    const userUUID1 = v4();

    const bol1 = await ServiceUserAgreement.hasCollectData(userUUID1);

    ava.is(bol1, false);
    
});

test(`${namespace} - delete user agreement`, async ava => {
    const userUUID = v4();

    await UserAgreementDAO().insert({
        user_uuid: userUUID,
        is_agree_collect_data: true,
    });

    const serviceUserAgreement = new ServiceUserAgreement(userUUID);
    await serviceUserAgreement.physicalDeletion();

    const result = await UserAgreementDAO().findOne(["is_agree_collect_data"], {
        user_uuid: userUUID,
    });

    ava.is(result, undefined);

    const bol = await serviceUserAgreement.hasCollectData();

    ava.is(bol, false);

});
test(`${namespace} - get agree collect data`, async ava => {

    const userUUID = v4();
    await UserAgreementDAO().insert({
        user_uuid: userUUID,
        is_agree_collect_data: true,
    });

    const serviceUserAgreement = new ServiceUserAgreement(userUUID);
    const result = await serviceUserAgreement.isAgreeCollectData();

    ava.not(result, undefined);
    ava.is(result, true);

    const serviceUserAgreement1 = new ServiceUserAgreement(v4());

    const result1 = await serviceUserAgreement1.hasCollectData();
    ava.is(result1, false);

    const result2 = await serviceUserAgreement.isAgreeCollectData();
    ava.is(result2, true);
});
test(`${namespace} - get user by rtc_uuid collect agreement`, async ava => {

    const userUUID = v4();
    const roomUUID = v4();
    const rtcUUID = cryptoRandomString({ length: 6, type: "numeric" });
    const rtcUUID1 = cryptoRandomString({ length: 6, type: "numeric" });

    await Promise.all([
        RoomUserDAO().insert({
            room_uuid: roomUUID,
            user_uuid: userUUID,
            rtc_uid: rtcUUID,
        }),
        UserAgreementDAO().insert({
            user_uuid: userUUID,
            is_agree_collect_data: true,
        }),
    ]);

    const result = await RoomUserDAO().findOne(["user_uuid"], {
        rtc_uid: rtcUUID,
        room_uuid: roomUUID,
    });

    ava.not(result, undefined);

    ava.is(result?.user_uuid, userUUID);

    const result1 = await UserAgreementDAO().findOne(["user_uuid", "is_agree_collect_data"], {
        user_uuid: userUUID,
    });

    ava.not(result1, undefined);

    ava.is(result?.user_uuid, result1?.user_uuid);

    const rtcUids = [rtcUUID, rtcUUID1];
    const userAgreementMap:Map<string, boolean> = new Map(rtcUids.map(rtc_uid => [rtc_uid, false]));
    const length = rtcUids.length;
    if (length > 0) {
        let i = 0;
        while (i < length) {
            const j = i + 50;
            const batchedRtcUids = rtcUids.slice(i, j);
            const roomUserInfos = await dataSource
                .createQueryBuilder(RoomUserModel, "ru")
                .where("ru.room_uuid = :room_uuid", { room_uuid:roomUUID })
                .andWhere("ru.rtc_uid IN (:...rtc_uids)", { rtc_uids: batchedRtcUids })
                .getMany();
            const userUuids = roomUserInfos.map(user => user.user_uuid);
            if (userUuids.length > 0) {
                const userAgreements = await dataSource
                    .createQueryBuilder(UserAgreementModel, "ua")
                    .where("ua.user_uuid IN (:...userUuids)", { userUuids })
                    .getMany();;
                for (const userInfo of roomUserInfos) {
                    const { rtc_uid, user_uuid } = userInfo;
                    const userAgreement = userAgreements.find(ua => ua.user_uuid === user_uuid);
                    if (userAgreement) {
                        userAgreementMap.set(rtc_uid, userAgreement.is_agree_collect_data);
                    } else {
                        userAgreementMap.set(rtc_uid, true);
                    }
                }
            }
            i = j;   
        }
    }
    const obj = Object.fromEntries(userAgreementMap);

    ava.is(result1?.is_agree_collect_data, obj?.[rtcUUID]);

    ava.is(false, obj?.[rtcUUID1]);
});