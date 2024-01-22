import { ResponseSuccess } from "../../../types/Server";

import { Server } from "../../../utils/registryRoutersV2";
import { Type } from "@sinclair/typebox";
import { successJSON } from "../internal/utils/response-json";

import { configHash } from "../../../utils/ParseConfig";
import {
    Server as ServerConfig,
    WeChat,
    Github,
    Google,
    Apple,
    AgoraLogin,
    PhoneSMS,
    Whiteboard,
    Agora,
    CloudStorage,
    StorageService,
    Censorship,
} from "../../../constants/Config";

type regionConfigsResponseSchema = {
    hash: string;
    login: {
        wechatWeb: boolean;
        wechatMobile: boolean;
        github: boolean;
        google: boolean;
        apple: boolean;
        agora: boolean;
        sms: boolean;
        smsForce: boolean;
    };
    server: {
        region: string;
        regionCode: number;
        env: string;
        joinEarly: number;
    };
    whiteboard: {
        appId: string;
        convertRegion: string;
    };
    agora: {
        clientId: string;
        appId: string;
        screenshot: boolean;
        messageNotification: boolean;
    };
    github: {
        clientId: string;
    };
    wechat: {
        webAppId: string;
        mobileAppId: string;
    };
    google: {
        clientId: string;
    };
    cloudStorage: {
        singleFileSize: number;
        totalSize: number;
        allowFileSuffix: Array<String>;
        accessKey: string;
    };
    censorship: {
        video: boolean;
        voice: boolean;
        text: boolean;
    };
};

// export for unit test
export const regionConfigs = async (): Promise<ResponseSuccess<regionConfigsResponseSchema>> => {
    return successJSON({
        hash: configHash,
        login: {
            wechatWeb: WeChat.web.enable,
            wechatMobile: WeChat.mobile.enable,
            github: Github.enable,
            google: Google.enable,
            apple: Apple.enable,
            agora: AgoraLogin.enable,
            sms: PhoneSMS.enable,
            smsForce: PhoneSMS.force,
        },
        server: {
            region: ServerConfig.region,
            regionCode: ServerConfig.regionCode,
            env: ServerConfig.env,
            joinEarly: ServerConfig.joinEarly,
        },
        whiteboard: {
            appId: Whiteboard.appId,
            convertRegion: Whiteboard.convertRegion,
        },
        agora: {
            clientId: AgoraLogin.clientId,
            appId: Agora.appId,
            screenshot: Agora.screenshot.enable,
            messageNotification: Agora.messageNotification.enable,
        },
        github: {
            clientId: Github.clientId,
        },
        wechat: {
            webAppId: WeChat.web.appId,
            mobileAppId: WeChat.mobile.appId,
        },
        google: {
            clientId: Google.clientId,
        },
        cloudStorage: {
            singleFileSize: CloudStorage.singleFileSize,
            totalSize: CloudStorage.totalSize,
            allowFileSuffix: CloudStorage.allowFileSuffix,
            accessKey: StorageService.oss.accessKey,
        },
        censorship: {
            video: Censorship.video.enable,
            voice: Censorship.voice.enable,
            text: Censorship.text.enable,
        },
    });
};

export const regionConfigsRouters = (server: Server): void => {
    server.get("region/configs", regionConfigs, {
        schema: Type.Object({}),
        auth: false,
    });
};
