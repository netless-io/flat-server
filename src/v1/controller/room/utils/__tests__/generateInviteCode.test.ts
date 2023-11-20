import test from "ava";
import { generateInviteCode } from "../GenerateInviteCode";
import { Server } from "../../../../../constants/Config";

const namespace = "[utils][utils-room][utils-room-invite-code]";

test(`${namespace} - generate invite code`, async ava => {
    const inviteCodeList = [];

    for (let i = 0; i < 100; i++) {
        inviteCodeList.push(await generateInviteCode());
    }

    const matchInviteCode = /^\d{11}$/;
    const result = inviteCodeList.every(code => {
        if (code === null) {
            // conflict
            return true;
        } else {
            ava.is(
                code[0],
                `${Server.regionCode}`,
                `invite code first number is Server.regionCode: ${Server.regionCode}`,
            );
            return matchInviteCode.test(code);
        }
    });

    ava.true(result, "invite code must is 11 digits");
});
