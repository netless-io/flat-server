export interface UserUploadAvatarStartConfig {
    fileName: string;
    fileSize: number;
}

export interface UserUploadAvatarStartReturn {
    fileUUID: string;
    ossDomain: string;
    ossFilePath: string;
    policy: string;
    signature: string;
}

export interface GetAvatarInfoByRedisReturn {
    fileName: string;
}

export interface UserUploadAvatarFinishReturn {
    avatarURL: string;
}
