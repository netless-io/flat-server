import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const configDirPath =
    process.env.IS_TEST === "yes"
        ? path.join(__dirname, "..", "..", "config")
        : path.join(__dirname, "..", "config");

const env = process.env.IS_TEST === "yes" ? "test" : process.env.NODE_ENV;

const configPath = (() => {
    const filenames = [`${env}.local.yaml`, `${env}.yaml`];

    for (const filename of filenames) {
        const fullPath = path.join(configDirPath, filename);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    throw new Error("not found config file");
})();

const yamlContent = fs.readFileSync(configPath, "utf8");

export const configHash = crypto.createHash("md5").update(yamlContent).digest("hex");

export const config = yaml.load(yamlContent) as Config;

type Config = {
    server: {
        port: number;
        env: string;
        region: string | null;
        region_code: number | null;
        join_early: number | null;
    };
    redis: {
        host: string;
        port: number;
        username: string | null;
        password: string;
        db: number;
        queueDB: number;
    };
    mysql: {
        host: string;
        port: number;
        username: string;
        password: string;
        db: string;
    };
    jwt: {
        secret: string;
        algorithms: string;
    };
    website: string;
    default_avatar: string;
    log: {
        pathname: string;
        filename: string;
    };
    metrics: {
        enable: boolean;
        endpoint: string;
        port: number;
    };
    cloud_storage: {
        concurrent: number;
        single_file_size: number;
        total_size: number;
        prefix_path: string;
        allow_file_suffix: string[];
        temp_photo: {
            single_file_size: number;
            total_files: number;
            prefix_path: string;
            allow_suffix: string[];
        };
    };
    user: {
        avatar: {
            size: number;
            allow_suffix: string[];
        };
    };
    oauth: {
        logo: {
            prefix_path: string;
            size: number;
            allow_suffix: string[];
        };
    };
    login: {
        salt: string;
        wechat: {
            web: {
                enable: boolean;
                app_id: string;
                app_secret: string;
            };
            mobile: {
                enable: boolean;
                app_id: string;
                app_secret: string;
            };
        };
        github: {
            enable: boolean;
            client_id: string;
            client_secret: string;
        };
        google: {
            enable: boolean;
            client_id: string;
            client_secret: string;
            redirect_uri: {
                login: string;
                bind: string;
            };
        };
        apple: {
            enable: boolean;
            aud?: string;
        };
        agora: {
            enable: boolean;
            client_id: string;
            client_secret: string;
        };
        sms: {
            enable: boolean;
            force: boolean;
            test_users: Array<{
                phone: string;
                code: number;
            }>;
            chinese_mainland: SMSConfig;
            hmt: SMSConfig;
            global: SMSConfig;
        };
        email: {
            enable: boolean;
            test_emails: Array<{
                email: string;
                code: number;
            }>;
            type: string;
            aliCloud: {
                access_id: string;
                access_secret: string;
                account_name: string;
            };
            smtp: {
                host: string;
                port: number;
                secure: boolean;
                auth: {
                    user: string;
                    pass: string;
                };
            };
        };
    };
    agora: {
        app: {
            id: string;
            certificate: string;
        };
        restful: {
            id: string;
            secret: string;
        };
        oss: {
            access_id: string;
            access_secret: string;
            vendor: number;
            region: number;
            bucket: string;
            folder: string;
            prefix: string;
        };
        screenshot: {
            enable: boolean;
            oss: {
                access_id: string;
                access_secret: string;
                vendor: number;
                region: number;
                bucket: string;
                folder: string;
                prefix: string;
            };
        };
        messageNotification: {
            enable: boolean;
            events: Array<{
                productID: number;
                eventType: number;
                secret: string;
            }>;
        };
        ai: {
            server_cn: string;
            server_en: string;
            server_cn_new: string;
            server_en_new: string;
        }
    };
    whiteboard: {
        app_id: string;
        access_key: string;
        secret_access_key: string;
        region: "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon";
        convert_region: "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon";
    };
    apple: {
        app_id: string;
    };
    storage_service: {
        type: "oss";
        oss: {
            access_key: string;
            secret_key: string;
            endpoint: string;
            bucket: string;
            region: string;
        };
    };
    censorship: {
        video: {
            enable: boolean;
            type: string;
            aliCloud: {
                access_id: string;
                access_secret: string;
                endpoint: string;
            };
        };
        voice: {
            enable: boolean;
            type: string;
            aliCloud: {
                uid: number;
                access_id: string;
                access_secret: string;
                callback_address: string;
            };
        };
        text: {
            enable: boolean;
            type: string;
            aliCloud: {
                access_id: string;
                access_secret: string;
                endpoint: string;
            };
        };
    };
    admin: {
        secret: string;
    };
};

interface SMSConfig {
    access_id: string;
    access_secret: string;
    template_code: string;
    sign_name: string;
}
