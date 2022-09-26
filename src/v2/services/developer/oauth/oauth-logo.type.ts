export interface DeveloperOAuthLogoStartConfig {
    oauthUUID: string;
    fileName: string;
    fileSize: number;
}

export interface DeveloperOAuthLogoStartReturn {
    fileUUID: string;
    ossDomain: string;
    ossFilePath: string;
    policy: string;
    signature: string;
}

export interface DeveloperOAuthLogoFinishConfig {
    oauthUUID: string;
    fileUUID: string;
}

export interface GetDeveloperOAuthLogoByRedisReturn {
    fileName: string;
}
