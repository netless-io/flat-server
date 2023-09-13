import test from "ava";
import { Logger } from "../../../../../logger";
import { LoggerFormat } from "../../../../../logger/Logger";
import { LoggerAbstractPlugin } from "../../../../../logger/plugins/LoggerAbstractPlugin";
import { v4 } from "uuid";
import RedisService from "../../../../../thirdPartyService/RedisService";
import { stub } from "sinon";
import { generateRoomInviteCode } from "../Utils";
import { RedisKey } from "../../../../../utils/Redis";

const namespace =
    "[utils][utils-room][utils-room-create-utils][utils-room-create-utils-generate-invite-code]";

class TestPlugin extends LoggerAbstractPlugin<any> {
    public constructor(public testLogOutput: LoggerFormat<any>) {
        super();
    }

    public output(log: LoggerFormat<any>): void {
        this.testLogOutput = log;
    }
}

test.serial(`${namespace} - invite code is room uuid when not vacant key`, async ava => {
    const testPlugin = new TestPlugin({} as LoggerFormat<any>);
    const logger = new Logger<any>("test", {}, [testPlugin]);

    const roomUUID = v4();

    const stubVacantKey = stub(RedisService, "vacantKey").returns(Promise.resolve(null));

    const inviteCode = await generateRoomInviteCode("ordinary", roomUUID, logger);

    ava.is(inviteCode, roomUUID);

    stubVacantKey.restore();
});

test.serial(`${namespace} - fallback room uuid when generate failed`, async ava => {
    const testPlugin = new TestPlugin({} as LoggerFormat<any>);
    const logger = new Logger<any>("test", {}, [testPlugin]);
    const roomUUID = v4();

    const stubVacantKey = stub(RedisService, "vacantKey").rejects(new Error("test error"));

    const inviteCode = await generateRoomInviteCode("ordinary", roomUUID, logger);

    ava.is(inviteCode, roomUUID);
    ava.is(testPlugin.testLogOutput.level, "warn");

    stubVacantKey.restore();
});

test.serial(`${namespace} - normal generate`, async ava => {
    const testPlugin = new TestPlugin({} as LoggerFormat<any>);
    const logger = new Logger<any>("test", {}, [testPlugin]);
    const roomUUID = v4();

    const inviteCode = await generateRoomInviteCode("ordinary", roomUUID, logger);

    ava.not(inviteCode, roomUUID);

    ava.is(await RedisService.get(RedisKey.roomInviteCode(inviteCode)), roomUUID);
    ava.is(await RedisService.get(RedisKey.roomInviteCodeReverse(roomUUID)), inviteCode);
});

test.serial(`${namespace} - generate failed when already exists redis key`, async ava => {
    const testPlugin = new TestPlugin({} as LoggerFormat<any>);
    const logger = new Logger<any>("test", {}, [testPlugin]);
    const roomUUID = v4();

    await RedisService.set(RedisKey.roomInviteCodeReverse(roomUUID), "test");

    const inviteCode = await generateRoomInviteCode("ordinary", roomUUID, logger);

    ava.is(inviteCode, roomUUID);

    ava.is(testPlugin.testLogOutput.level, "warn");
});
