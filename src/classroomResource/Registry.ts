import { ClassroomResources } from "../constants/Config";
import { Region } from "../constants/Project";
import { createHash } from "crypto";

export type ClassroomResourceProfile = {
    key: string;
    channelCode: string;
    configVersion: number;
    rtcProvider: "agora" | "openflat_rtc";
    rtmProvider: "agora";
    mediaRegion: string;
    agora: {
        appId: string;
        certificate: string;
        restfulId: string;
        restfulSecret: string;
    };
    whiteboard: {
        appId: string;
        accessKey: string;
        secretAccessKey: string;
        region: Region;
        convertRegion: Region;
    };
    cloudRecording: {
        vendor: number;
        region: number;
        bucket: string;
        accessId: string;
        accessSecret: string;
        folder: string;
        prefix: string;
    };
    recordingProvider: "agora" | "openflat_rtc";
};

const profiles = new Map<string, ClassroomResourceProfile>();
if (
    !ClassroomResources.billing_base_url.trim() ||
    !ClassroomResources.billing_internal_token.trim() ||
    !ClassroomResources.default_profile_key.trim() ||
    !ClassroomResources.profiles.length
) {
    throw new Error("classroom resource control plane configuration is incomplete");
}

export function validateClassroomResourceProfileIdentities(
    identities: ReadonlyArray<{ key: string; channelCode: string; configVersion: number }>,
): void {
    const keys = new Set<string>();
    const channelVersions = new Set<string>();
    for (const identity of identities) {
        const key = identity.key.trim();
        const channelCode = identity.channelCode.trim();
        const configVersion = Number(identity.configVersion);
        if (!key || keys.has(key)) {
            throw new Error(`invalid or duplicate classroom resource profile: ${identity.key}`);
        }
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(channelCode)) {
            throw new Error(`invalid classroom resource channel code: ${identity.channelCode}`);
        }
        if (!Number.isSafeInteger(configVersion) || configVersion < 1) {
            throw new Error(`invalid classroom resource config version: ${identity.configVersion}`);
        }
        const versionIdentity = `${channelCode}\u0000${configVersion}`;
        if (channelVersions.has(versionIdentity)) {
            throw new Error(
                `duplicate classroom resource channel version: ${channelCode}@${configVersion}`,
            );
        }
        keys.add(key);
        channelVersions.add(versionIdentity);
    }
}

validateClassroomResourceProfileIdentities(
    ClassroomResources.profiles.map(raw => ({
        key: raw.key,
        channelCode: raw.channel_code,
        configVersion: raw.config_version,
    })),
);
for (const raw of ClassroomResources.profiles) {
    const key = raw.key.trim();
    const channelCode = raw.channel_code.trim();
    const configVersion = Number(raw.config_version);
    const profile: ClassroomResourceProfile = {
        key,
        channelCode,
        configVersion,
        rtcProvider: raw.rtc_provider,
        rtmProvider: raw.rtm_provider,
        mediaRegion: raw.media_region.trim().toUpperCase(),
        agora: {
            appId: raw.agora.app_id,
            certificate: raw.agora.certificate,
            restfulId: raw.agora.restful_id || "",
            restfulSecret: raw.agora.restful_secret || "",
        },
        whiteboard: {
            appId: raw.whiteboard.app_id,
            accessKey: raw.whiteboard.access_key,
            secretAccessKey: raw.whiteboard.secret_access_key,
            region: raw.whiteboard.region as Region,
            convertRegion: (raw.whiteboard.convert_region || raw.whiteboard.region) as Region,
        },
        cloudRecording: {
            vendor: Number(raw.cloud_recording?.vendor || 0),
            region: Number(raw.cloud_recording?.region || 0),
            bucket: raw.cloud_recording?.bucket || "",
            accessId: raw.cloud_recording?.access_id || "",
            accessSecret: raw.cloud_recording?.access_secret || "",
            folder: raw.cloud_recording?.folder || "",
            prefix: raw.cloud_recording?.prefix || "",
        },
        recordingProvider: raw.recording_provider,
    };
    validateProfile(profile);
    profiles.set(profile.key, deepFreezeProfile(profile));
}

const defaultProfileKey = ClassroomResources.default_profile_key.trim();
if (!profiles.has(defaultProfileKey)) {
    throw new Error(`classroom resource default profile is missing: ${defaultProfileKey}`);
}

function validateProfile(profile: ClassroomResourceProfile): void {
    if (profile.rtcProvider !== "agora" && profile.rtcProvider !== "openflat_rtc") {
        throw new Error(`unsupported RTC provider in profile: ${profile.key}`);
    }
    if (!/^[A-Z][A-Z0-9_-]{1,15}$/.test(profile.mediaRegion)) {
        throw new Error(`invalid media region in profile: ${profile.key}`);
    }
    if (profile.rtmProvider !== "agora" || profile.recordingProvider !== profile.rtcProvider) {
        throw new Error(`invalid RTM or recording provider in profile: ${profile.key}`);
    }
    const commonRequired = [
        profile.mediaRegion,
        profile.agora.appId,
        profile.agora.certificate,
        profile.whiteboard.appId,
        profile.whiteboard.accessKey,
        profile.whiteboard.secretAccessKey,
        profile.whiteboard.region,
    ];
    const agoraRTCRequired = [
        profile.agora.restfulId,
        profile.agora.restfulSecret,
        profile.cloudRecording.bucket,
        profile.cloudRecording.accessId,
        profile.cloudRecording.accessSecret,
    ];
    if (
        commonRequired.some(value => !String(value || "").trim()) ||
        (profile.rtcProvider === "agora" &&
            agoraRTCRequired.some(value => !String(value || "").trim()))
    ) {
        throw new Error(`classroom resource profile is incomplete: ${profile.key}`);
    }
}

function deepFreezeProfile(profile: ClassroomResourceProfile): ClassroomResourceProfile {
    Object.freeze(profile.agora);
    Object.freeze(profile.whiteboard);
    Object.freeze(profile.cloudRecording);
    return Object.freeze(profile);
}

export function getClassroomResourceProfile(key: string): ClassroomResourceProfile {
    const profile = profiles.get(key);
    if (!profile) {
        throw new Error(`classroom resource profile not found: ${key}`);
    }
    return profile;
}

export function getDefaultClassroomResourceProfile(): ClassroomResourceProfile {
    return getClassroomResourceProfile(defaultProfileKey);
}

export function getClassroomResourcePublicConfig(key: string): {
    profileKey: string;
    channelCode: string;
    configVersion: number;
    rtcProvider: "agora" | "openflat_rtc";
    rtmProvider: "agora";
    mediaRegion: string;
    recordingProvider: "agora" | "openflat_rtc";
    agoraAppID: string;
    whiteboardAppID: string;
    whiteboardRegion: Region;
    configFingerprint: string;
} {
    const profile = getClassroomResourceProfile(key);
    return {
        profileKey: profile.key,
        channelCode: profile.channelCode,
        configVersion: profile.configVersion,
        rtcProvider: profile.rtcProvider,
        rtmProvider: profile.rtmProvider,
        mediaRegion: profile.mediaRegion,
        recordingProvider: profile.recordingProvider,
        agoraAppID: profile.agora.appId,
        whiteboardAppID: profile.whiteboard.appId,
        whiteboardRegion: profile.whiteboard.region,
        configFingerprint: createHash("sha256").update(JSON.stringify(profile)).digest("hex"),
    };
}

export function hasClassroomResourceProfile(key: string): boolean {
    return profiles.has(key);
}

export function listClassroomResourcePublicConfigs(): ReturnType<
    typeof getClassroomResourcePublicConfig
>[] {
    return Array.from(profiles.keys()).map(getClassroomResourcePublicConfig);
}
