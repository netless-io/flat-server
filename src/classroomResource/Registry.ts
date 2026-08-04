import { Agora, ClassroomResources, Whiteboard } from "../constants/Config";
import { Region } from "../constants/Project";
import { createHash } from "crypto";

export type ClassroomResourceProfile = {
    key: string;
    provider: string;
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
};

const legacyProfile: ClassroomResourceProfile = {
    key: "legacy_default",
    provider: "agora_netless",
    agora: {
        appId: Agora.appId,
        certificate: Agora.appCertificate,
        restfulId: Agora.restfulId,
        restfulSecret: Agora.restfulSecret,
    },
    whiteboard: {
        appId: Whiteboard.appId,
        accessKey: Whiteboard.accessKey,
        secretAccessKey: Whiteboard.secretAccessKey,
        region: Whiteboard.region as Region,
        convertRegion: Whiteboard.convertRegion as Region,
    },
    cloudRecording: {
        vendor: Number(Agora.ossVendor),
        region: Number(Agora.ossRegion),
        bucket: Agora.ossBucket,
        accessId: Agora.ossAccessKeyId,
        accessSecret: Agora.ossAccessKeySecret,
        folder: Agora.ossFolder,
        prefix: Agora.ossPrefix,
    },
};

const profiles = new Map<string, ClassroomResourceProfile>();
const hasConfiguredProfiles = Boolean(ClassroomResources?.profiles?.length);

if (hasConfiguredProfiles) {
    if (
        !ClassroomResources?.billing_base_url?.trim() ||
        !ClassroomResources?.billing_internal_token?.trim()
    ) {
        throw new Error(
            "classroom resource profiles require billing_base_url and billing_internal_token",
        );
    }
    for (const raw of ClassroomResources.profiles) {
        if (!raw.key || profiles.has(raw.key)) {
            throw new Error(`invalid or duplicate classroom resource profile: ${raw.key}`);
        }
        const profile: ClassroomResourceProfile = {
            key: raw.key,
            provider: raw.provider || "agora_netless",
            agora: {
                appId: raw.agora.app_id,
                certificate: raw.agora.certificate,
                restfulId: raw.agora.restful_id,
                restfulSecret: raw.agora.restful_secret,
            },
            whiteboard: {
                appId: raw.whiteboard.app_id,
                accessKey: raw.whiteboard.access_key,
                secretAccessKey: raw.whiteboard.secret_access_key,
                region: raw.whiteboard.region as Region,
                convertRegion: (raw.whiteboard.convert_region || raw.whiteboard.region) as Region,
            },
            cloudRecording: {
                vendor: Number(raw.cloud_recording.vendor),
                region: Number(raw.cloud_recording.region),
                bucket: raw.cloud_recording.bucket,
                accessId: raw.cloud_recording.access_id,
                accessSecret: raw.cloud_recording.access_secret,
                folder: raw.cloud_recording.folder,
                prefix: raw.cloud_recording.prefix,
            },
        };
        validateProfile(profile);
        profiles.set(profile.key, Object.freeze(profile));
    }
} else {
    profiles.set(legacyProfile.key, Object.freeze(legacyProfile));
}

const defaultProfileKey = ClassroomResources?.default_profile_key || legacyProfile.key;
if (!profiles.has(defaultProfileKey)) {
    throw new Error(`classroom resource default profile is missing: ${defaultProfileKey}`);
}

function validateProfile(profile: ClassroomResourceProfile): void {
    const required = [
        profile.agora.appId,
        profile.agora.certificate,
        profile.agora.restfulId,
        profile.agora.restfulSecret,
        profile.whiteboard.appId,
        profile.whiteboard.accessKey,
        profile.whiteboard.secretAccessKey,
        profile.whiteboard.region,
        profile.cloudRecording.bucket,
        profile.cloudRecording.accessId,
        profile.cloudRecording.accessSecret,
    ];
    if (required.some(value => !String(value || "").trim())) {
        throw new Error(`classroom resource profile is incomplete: ${profile.key}`);
    }
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
    provider: string;
    agoraAppID: string;
    whiteboardAppID: string;
    whiteboardRegion: Region;
    configFingerprint: string;
} {
    const profile = getClassroomResourceProfile(key);
    return {
        profileKey: profile.key,
        provider: profile.provider,
        agoraAppID: profile.agora.appId,
        whiteboardAppID: profile.whiteboard.appId,
        whiteboardRegion: profile.whiteboard.region,
        configFingerprint: createHash("sha256")
            .update(JSON.stringify(profile))
            .digest("hex"),
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
