import test from "ava";
import {
    getClassroomResourcePublicConfig,
    getDefaultClassroomResourceProfile,
    validateClassroomResourceProfileIdentities,
} from "./Registry";

test("classroom resource discovery exposes explicit identity and media region", ava => {
    const profile = getDefaultClassroomResourceProfile();
    const publicConfig = getClassroomResourcePublicConfig(profile.key);

    ava.is(publicConfig.channelCode, profile.channelCode);
    ava.is(publicConfig.configVersion, profile.configVersion);
    ava.is(publicConfig.mediaRegion, profile.mediaRegion);
    ava.truthy(publicConfig.configFingerprint);
    ava.not(publicConfig.mediaRegion, profile.whiteboard.region);
});

test("classroom resource profiles reject duplicate keys", ava => {
    const error = ava.throws(() =>
        validateClassroomResourceProfileIdentities([
            { key: "agora-a-v1", channelCode: "agora-a", configVersion: 1 },
            { key: "agora-a-v1", channelCode: "agora-a", configVersion: 2 },
        ]),
    );

    ava.regex(error?.message || "", /duplicate classroom resource profile/);
});

test("classroom resource profiles reject duplicate channel versions", ava => {
    const error = ava.throws(() =>
        validateClassroomResourceProfileIdentities([
            { key: "agora-a-primary", channelCode: "agora-a", configVersion: 3 },
            { key: "agora-a-canary", channelCode: "agora-a", configVersion: 3 },
        ]),
    );

    ava.regex(error?.message || "", /duplicate classroom resource channel version/);
});

test("classroom resource profile versions need not be contiguous", ava => {
    ava.notThrows(() =>
        validateClassroomResourceProfileIdentities([
            { key: "agora-a-old", channelCode: "agora-a", configVersion: 2 },
            { key: "agora-a-current", channelCode: "agora-a", configVersion: 9 },
        ]),
    );
});

test("classroom resource profiles reject invalid versions and channel codes", ava => {
    ava.throws(() =>
        validateClassroomResourceProfileIdentities([
            { key: "bad-version", channelCode: "agora-a", configVersion: 0 },
        ]),
    );
    ava.throws(() =>
        validateClassroomResourceProfileIdentities([
            { key: "bad-channel", channelCode: "agora/a", configVersion: 1 },
        ]),
    );
});
