import packages from "../../package.json";
import { config } from "../utils/ParseConfig";

export const isDev = process.env.NODE_ENV === "development";
export const isTest = process.env.IS_TEST === "yes";

export const Server = {
    port: config.server.port,
    name: "flat-server",
    version: packages.version,
    env: config.server.env,
    region: config.server.region || "CN",
    // value: 1-9
    regionCode: config.server.region_code || 1,
    joinEarly: config.server.join_early || 5,
};

export const Redis = {
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.username || "",
    password: config.redis.password,
    db: config.redis.db,
    queueDB: config.redis.queueDB,
};

export const MySQL = {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.username,
    password: config.mysql.password,
    db: config.mysql.db,
};

export const Salt = config.login.salt;

export const Website = config.website;

/** @param index 0..17 */
export const defaultAvatar = (index: number): string =>
    config.default_avatar.replace("[index]", String(index));

export const WeChat = {
    web: {
        enable: config.login.wechat.web.enable,
        appId: config.login.wechat.web.app_id,
        appSecret: config.login.wechat.web.app_secret,
    },
    mobile: {
        enable: config.login.wechat.mobile.enable,
        appId: config.login.wechat.mobile.app_id,
        appSecret: config.login.wechat.mobile.app_secret,
    },
};

export const Github = {
    enable: config.login.github.enable,
    clientId: config.login.github.client_id,
    clientSecret: config.login.github.client_secret,
};

export const Apple = {
    enable: config.login.apple.enable,
    appId: config.apple.app_id,
    aud: config.login.apple.aud || "io.agora.flat",
};

export const AgoraLogin = {
    enable: config.login.agora.enable,
    clientId: config.login.agora.client_id,
    clientSecret: config.login.agora.client_secret,
};

export const Google = {
    enable: config.login.google.enable,
    clientId: config.login.google.client_id,
    clientSecret: config.login.google.client_secret,
    redirectURI: config.login.google.redirect_uri,
};

export const PhoneSMS = {
    enable: config.login.sms.enable,
    force: config.login.sms.force,
    testUsers: config.login.sms.test_users.map(user => {
        return {
            phone: String(user.phone),
            code: user.code,
        };
    }),
    chineseMainland: {
        accessId: config.login.sms.chinese_mainland.access_id,
        accessSecret: config.login.sms.chinese_mainland.access_secret,
        templateCode: config.login.sms.chinese_mainland.template_code,
        signName: config.login.sms.chinese_mainland.sign_name,
    },
    hmt: {
        accessId: config.login.sms.hmt.access_id,
        accessSecret: config.login.sms.hmt.access_secret,
        templateCode: config.login.sms.hmt.template_code,
        signName: config.login.sms.hmt.sign_name,
    },
    global: {
        accessId: config.login.sms.global.access_id,
        accessSecret: config.login.sms.global.access_secret,
        templateCode: config.login.sms.global.template_code,
        signName: config.login.sms.global.sign_name,
    },
};

export const EmailSMS = {
    enable: config.login.email.enable,
    testEmails: config.login.email.test_emails.map(user => {
        return {
            email: String(user.email),
            code: user.code,
        };
    }),
    type: config.login.email.type,
    aliCloud: {
        accessId: config.login.email.aliCloud.access_id,
        accessSecret: config.login.email.aliCloud.access_secret,
        accountName: config.login.email.aliCloud.account_name,
    },
    smtp: {
        host: config.login.email.smtp.host,
        port: config.login.email.smtp.port,
        secure: config.login.email.smtp.secure,
        auth: {
            user: config.login.email.smtp.auth.user,
            pass: config.login.email.smtp.auth.pass,
        },
    },
};

export const Agora = {
    appId: config.agora.app.id,
    appCertificate: config.agora.app.certificate,
    restfulId: config.agora.restful.id,
    restfulSecret: config.agora.restful.secret,
    ossVendor: config.agora.oss.vendor,
    ossAccessKeyId: config.agora.oss.access_id,
    ossAccessKeySecret: config.agora.oss.access_secret,
    ossRegion: config.agora.oss.region,
    ossBucket: config.agora.oss.bucket,
    ossFolder: config.agora.oss.folder,
    ossPrefix: config.agora.oss.prefix,
    screenshot: {
        enable: config.agora.screenshot.enable,
        oss: {
            vendor: config.agora.screenshot.oss.vendor,
            accessKeyId: config.agora.screenshot.oss.access_id,
            accessKeySecret: config.agora.screenshot.oss.access_secret,
            region: config.agora.screenshot.oss.region,
            bucket: config.agora.screenshot.oss.bucket,
            folder: config.agora.screenshot.oss.folder,
            prefix: config.agora.screenshot.oss.prefix,
        },
    },
    messageNotification: {
        enable: config.agora.messageNotification.enable,
        events: config.agora.messageNotification.events,
    },
    ai: {
        server_cn: config.agora.ai.server_cn,
        server_en: config.agora.ai.server_en,
        server_cn_new: config.agora.ai.server_cn_new,
        server_en_new: config.agora.ai.server_en_new,
    }
};

export const JWT = {
    secret: config.jwt.secret,
    algorithms: config.jwt.algorithms,
};

export const Whiteboard = {
    appId: config.whiteboard.app_id,
    accessKey: config.whiteboard.access_key,
    secretAccessKey: config.whiteboard.secret_access_key,
    region: config.whiteboard.region,
    convertRegion: config.whiteboard.convert_region,
};

export const CloudStorage = {
    concurrent: config.cloud_storage.concurrent,
    singleFileSize: config.cloud_storage.single_file_size,
    totalSize: config.cloud_storage.total_size,
    prefixPath: config.cloud_storage.prefix_path,
    allowFileSuffix: config.cloud_storage.allow_file_suffix,
    tempPhoto: {
        singleFileSize: config.cloud_storage.temp_photo.single_file_size,
        totalFiles: config.cloud_storage.temp_photo.total_files,
        prefixPath: config.cloud_storage.temp_photo.prefix_path,
        allowSuffix: config.cloud_storage.temp_photo.allow_suffix,
    },
};

export const StorageService = {
    type: config.storage_service.type,
    oss: {
        bucket: config.storage_service.oss.bucket,
        region: config.storage_service.oss.region,
        accessKey: config.storage_service.oss.access_key,
        accessKeySecret: config.storage_service.oss.secret_key,
        endpoint: config.storage_service.oss.endpoint,
    },
};

export const User = {
    avatar: {
        size: config.user.avatar.size,
        allowSuffix: config.user.avatar.allow_suffix,
    },
};

export const OAuth = {
    logo: {
        prefixPath: config.oauth.logo.prefix_path,
        size: config.oauth.logo.size,
        allowSuffix: config.oauth.logo.allow_suffix,
    },
};

export const LogConfig = {
    pathname: config.log.pathname,
    filename: config.log.filename,
};

export const Censorship = {
    video: {
        enable: config.censorship.video.enable,
        type: config.censorship.video.type,
        aliCloud: {
            accessID: config.censorship.video.aliCloud.access_id,
            accessSecret: config.censorship.video.aliCloud.access_secret,
            endpoint: config.censorship.video.aliCloud.endpoint,
        },
    },
    voice: {
        enable: config.censorship.voice.enable,
        type: config.censorship.voice.type,
        aliCloud: {
            uid: config.censorship.voice.aliCloud.uid,
            accessID: config.censorship.voice.aliCloud.access_id,
            accessSecret: config.censorship.voice.aliCloud.access_secret,
            callbackAddress: config.censorship.voice.aliCloud.callback_address,
        },
    },
    text: {
        enable: config.censorship.text.enable,
        type: config.censorship.text.type,
        aliCloud: {
            accessID: config.censorship.text.aliCloud.access_id,
            accessSecret: config.censorship.text.aliCloud.access_secret,
            endpoint: config.censorship.text.aliCloud.endpoint,
        },
    },
};

export const Admin = {
    secret: config.admin?.secret || "",
};

export const MetricsConfig = {
    enabled: process.env.METRICS_ENABLED === "true",
    endpoint: process.env.METRICS_ENDPOINT,
    port: Number(process.env.METRICS_PORT),
};
