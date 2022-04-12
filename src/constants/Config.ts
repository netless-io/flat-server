import packages from "../../package.json";
import { Region } from "./Project";
import { config } from "../utils/ParseConfig";

export const isDev = process.env.NODE_ENV === "development";
export const isTest = process.env.IS_TEST === "yes";

export const Server = {
    port: config.server.port,
    name: "flat-server",
    version: packages.version,
};

export const Redis = {
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.username || "",
    password: config.redis.password,
    db: config.redis.db,
};

export const MySQL = {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.username,
    password: config.mysql.password,
    db: config.mysql.db,
};

export const Website = config.website;

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
};

export const JWT = {
    secret: config.jwt.secret,
    algorithms: config.jwt.algorithms,
};

export const Whiteboard = {
    accessKey: config.whiteboard.access_key,
    secretAccessKey: config.whiteboard.secret_access_key,
};

export const CloudStorage = {
    concurrent: config.cloud_storage.concurrent,
    singleFileSize: config.cloud_storage.single_file_size,
    totalSize: config.cloud_storage.total_size,
    prefixPath: config.cloud_storage.prefix_path,
    allowFileSuffix: config.cloud_storage.allow_file_suffix,
    allowUrlFileSuffix: config.cloud_storage.url_file_suffix,
};

export const StorageService = {
    type: config.storage_service.type,
    oss: {
        [Region.CN_HZ]: {
            bucket: config.storage_service.oss.zh_hz.bucket,
            region: config.storage_service.oss.zh_hz.region,
            accessKey: config.storage_service.oss.zh_hz.access_key,
            accessKeySecret: config.storage_service.oss.zh_hz.secret_key,
            endpoint: config.storage_service.oss.zh_hz.endpoint,
        },
        [Region.US_SV]: {
            bucket: config.storage_service.oss.us_sv.bucket,
            region: config.storage_service.oss.us_sv.region,
            accessKey: config.storage_service.oss.us_sv.access_key,
            accessKeySecret: config.storage_service.oss.us_sv.secret_key,
            endpoint: config.storage_service.oss.us_sv.endpoint,
        },
        [Region.SG]: {
            bucket: config.storage_service.oss.sg.bucket,
            region: config.storage_service.oss.sg.region,
            accessKey: config.storage_service.oss.sg.access_key,
            accessKeySecret: config.storage_service.oss.sg.secret_key,
            endpoint: config.storage_service.oss.sg.endpoint,
        },
        [Region.IN_MUM]: {
            bucket: config.storage_service.oss.in_mum.bucket,
            region: config.storage_service.oss.in_mum.region,
            accessKey: config.storage_service.oss.in_mum.access_key,
            accessKeySecret: config.storage_service.oss.in_mum.secret_key,
            endpoint: config.storage_service.oss.in_mum.endpoint,
        },
        [Region.GB_LON]: {
            bucket: config.storage_service.oss.gb_lon.bucket,
            region: config.storage_service.oss.gb_lon.region,
            accessKey: config.storage_service.oss.gb_lon.access_key,
            accessKeySecret: config.storage_service.oss.gb_lon.secret_key,
            endpoint: config.storage_service.oss.gb_lon.endpoint,
        },
    },
};

export const LogConfig = {
    pathname: config.log.pathname,
    filename: config.log.filename,
};

export const MetricsConfig = {
    enabled: process.env.METRICS_ENABLED === "true",
    endpoint: process.env.METRICS_ENDPOINT,
    port: Number(process.env.METRICS_PORT),
};
