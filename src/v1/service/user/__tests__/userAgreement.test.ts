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
    const length = rtcUids.length;
    const listMap:Map<string, boolean> = new Map();
    if (length > 0) {
        let i = 0;
        const batchQueryRtcUids: string[][] = [];
        while (i < length) {
            const j = i + 50;
            batchQueryRtcUids.push(rtcUids.slice(i, j));
            i = j;   
        }
        for (const rtc_uids of batchQueryRtcUids) {
            const roomUsersInfos = await dataSource
                .createQueryBuilder(RoomUserModel, "ru")
                .where("ru.room_uuid = :room_uuid", {
                    room_uuid:roomUUID,
                })
                .andWhere("ru.rtc_uid IN (:...rtc_uids)", { rtc_uids })
                .getMany();

            for (const rtc_uid of rtc_uids) {
                listMap.set(rtc_uid, false);
            }
            const collectInfos = await dataSource
                .createQueryBuilder(UserAgreementModel, "cInfo")
                .where("cInfo.user_uuid IN (:...user_uuid)", { user_uuid: roomUsersInfos.map(c=> c && c.user_uuid) })
                .getMany();

            for (const rInfo of roomUsersInfos) {
                listMap.set(rInfo.rtc_uid, true);
                const rtc_uid = rInfo.rtc_uid;
                const user_uuid = rInfo.user_uuid;
                if (rtc_uid && user_uuid) {
                    const cInfo = collectInfos.find(c=> c && (c.user_uuid === user_uuid));
                    if (cInfo) {
                        listMap.set(rtc_uid, cInfo.is_agree_collect_data);
                    }
                }
            }
        }
    }
    const obj = Object.fromEntries(listMap);

    ava.is(result1?.is_agree_collect_data, obj?.[rtcUUID]);

    ava.is(false, obj?.[rtcUUID1]);
});