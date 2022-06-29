import test from "ava";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { UserDAO } from "../../../../dao";
import { Gender } from "../../../../constants/Project";
import { v4 } from "uuid";
import { ServiceUser } from "../User";
import { ControllerError } from "../../../../error/ControllerError";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "[service][service-user]";

test.before(`${namespace} - initialize dataSource`, async () => {
    await dataSource.initialize();
});

test.after(`${namespace} - destroy dataSource`, async () => {
    await dataSource.destroy();
});

test(`${namespace} - create user`, async ava => {
    const [userUUID, userName, avatarURL, gender] = [
        v4(),
        `test_user_${v4()}`,
        `https://test.com/${v4()}`,
        Gender.Man,
    ];

    const serviceUser = new ServiceUser(userUUID);

    await serviceUser.create({
        userName,
        avatarURL,
        gender,
    });

    const result = await UserDAO().findOne(["avatar_url", "gender"], {
        user_uuid: userUUID,
    });

    ava.not(result, undefined);

    ava.deepEqual(
        {
            avatarURL: result?.avatar_url,
            gender: result?.gender,
        },
        {
            avatarURL,
            gender,
        },
    );
});

test(`${namespace} - create user not gender`, async ava => {
    const [userUUID, userName, avatarURL] = [v4(), `test_user_${v4()}`, `https://test.com/${v4()}`];

    const serviceUser = new ServiceUser(userUUID);

    await serviceUser.create({
        userName,
        avatarURL,
    });

    const result = await UserDAO().findOne(["gender"], {
        user_uuid: userUUID,
    });

    ava.not(result, undefined);

    ava.is(result?.gender, Gender.None);
});

test(`${namespace} - has name and avatar`, async ava => {
    const [userUUID, userName, avatarURL] = [v4(), `test_name_${v4()}`, `https://test.com/${v4()}`];

    await UserDAO().insert({
        user_name: userName,
        avatar_url: avatarURL,
        gender: Gender.None,
        user_uuid: userUUID,
        user_password: "",
    });

    const serviceUser = new ServiceUser(userUUID);

    const result = await serviceUser.nameAndAvatar();

    if (result === null) {
        ava.fail("serviceUser.nameAndAvatar must has value");
    } else {
        ava.is(result.userName, userName);
        ava.is(result.avatarURL, avatarURL);
    }
});

test(`${namespace} - no found name and avatar`, async ava => {
    const serviceUser = new ServiceUser(v4());

    const result = await serviceUser.nameAndAvatar();

    ava.is(result, null);
});

test(`${namespace} - assert has name and avatar`, async ava => {
    const [userUUID, userName, avatarURL] = [v4(), `test_name_${v4()}`, `https://test.com/${v4()}`];

    await UserDAO().insert({
        user_name: userName,
        avatar_url: avatarURL,
        gender: Gender.None,
        user_uuid: userUUID,
        user_password: "",
    });

    const serviceUser = new ServiceUser(userUUID);

    await ava.notThrowsAsync(serviceUser.assertGetNameAndAvatar());

    ava.deepEqual(await serviceUser.assertGetNameAndAvatar(), {
        userName: userName,
        avatarURL: avatarURL,
    });
});

test(`${namespace} - assert has name and avatar failed`, async ava => {
    const serviceUser = new ServiceUser(v4());

    const rawError = await ava.throwsAsync<ControllerError>(serviceUser.assertGetNameAndAvatar());

    ava.is(rawError?.errorCode, ErrorCode.UserNotFound);
});

test(`${namespace} - update user name`, async ava => {
    const [oldName, newName, userUUID, avatarURL] = [v4(), v4(), v4(), `https://test.com/${v4()}`];
    await UserDAO().insert({
        user_name: oldName,
        avatar_url: avatarURL,
        gender: Gender.Woman,
        user_uuid: userUUID,
        user_password: "",
    });

    const serviceUser = new ServiceUser(userUUID);

    await serviceUser.updateName(newName);

    const result = await UserDAO().findOne(["user_name"], {
        user_uuid: userUUID,
    });

    ava.is(result?.user_name, newName);
});

test(`${namespace} - delete user`, async ava => {
    const [oldName, userUUID, avatarURL] = [v4(), v4(), `https://test.com/${v4()}`];
    await UserDAO().insert({
        user_name: oldName,
        avatar_url: avatarURL,
        gender: Gender.Woman,
        user_uuid: userUUID,
        user_password: "",
    });

    const serviceUser = new ServiceUser(userUUID);

    await serviceUser.physicalDeletion();

    const result = await UserDAO().findOne(["id"], {
        user_uuid: userUUID,
    });

    ava.is(result, undefined);
});

test(`${namespace} - delete not exist user`, async ava => {
    const userUUID = v4();
    const serviceUser = new ServiceUser(userUUID);

    await serviceUser.physicalDeletion();

    const result = await UserDAO().findOne(["id"], {
        user_uuid: userUUID,
    });

    ava.is(result, undefined);
});
