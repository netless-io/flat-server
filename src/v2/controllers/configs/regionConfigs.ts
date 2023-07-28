import { ResponseSuccess } from "../../../types/Server";

import { Server } from "../../../utils/registryRoutersV2";
import { Type } from "@sinclair/typebox";
import { successJSON } from "../internal/utils/response-json";

import {
    Server as ServerConfig, WeChat, Github, Google, Apple, AgoraLogin,
    PhoneSMS, Whiteboard, Agora, CloudStorage
} from "../../../constants/Config";

type regionConfigsResponseSchema = {
    login: {
        wechatWeb: boolean;
        wechatMobile: boolean;
        github: boolean;
        google: boolean;
        apple: boolean;
        agora: boolean;
        sms: boolean;
        smsForce: boolean;
    },
    server: {
        region: string;
        regionCode: number;
        env: string;
    },
    whiteboard: {
        convertRegion: string;
    },
    agora: {
        screenshot: boolean;
        messageNotification: boolean;
    },
    cloudStorage: {
        singleFileSize: number;
        totleSize: number;
        allowFileSuffix: Array<String>;
    };
};

// export for unit test
export const regionConfigs = async (): Promise<ResponseSuccess<regionConfigsResponseSchema>> => {
    return successJSON({
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
        },
        whiteboard: {
            convertRegion: Whiteboard.convertRegion
        },
        agora: {
            screenshot: Agora.screenshot.enable,
            messageNotification: Agora.messageNotification.enable,
        },
        cloudStorage: {
            singleFileSize: CloudStorage.singleFileSize,
            totleSize: CloudStorage.totalSize,
            allowFileSuffix: CloudStorage.allowFileSuffix,
        }
    });
};

export const regionConfigsRouters = (server: Server): void => {
    server.get("region/configs", regionConfigs, {
        schema: Type.Object({}),
        auth: false,
    });
};
