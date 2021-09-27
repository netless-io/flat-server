import test from "ava";
import { generateInviteCode } from "../GenerateInviteCode";

const namespace = "[utils][utils-room][utils-room-invite-code]";

test(`${namespace} - generate invite code`, async ava => {
    const inviteCodeList = [];

    for (let i = 0; i < 100; i++) {
        inviteCodeList.push(await generateInviteCode());
    }

    const matchInviteCode = /^\d{10}$/;
    const result = inviteCodeList.every(code => {
        ava.not(code![0], "0", "invite code first number is 0");
        return matchInviteCode.test(code!);
    });

    ava.true(result, "invite code must is 10 digits");
});
