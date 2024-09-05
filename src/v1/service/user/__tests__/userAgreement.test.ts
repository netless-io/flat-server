import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { RoomUserDAO, UserAgreementDAO } from "../../../../dao";
import { v4 } from "uuid";
import { ServiceUserAgreement } from "../UserAgreement";
import cryptoRandomString from "crypto-random-string";

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
test(`${namespace} - get user by rtc_uuid collect agreement`, async ava => {

    const userUUID = v4();
    const roomUUID = v4();
    const rtcUUID = cryptoRandomString({ length: 6, type: "numeric" });

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
    });

    ava.not(result, undefined);

    ava.is(result?.user_uuid, userUUID);

    const result1 = await UserAgreementDAO().findOne(["user_uuid"], {
        user_uuid: userUUID,
    });

    ava.not(result1, undefined);

    ava.is(result?.user_uuid, result1?.user_uuid);

});