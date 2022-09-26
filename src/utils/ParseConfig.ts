import yaml from "js-yaml";
import fs from "fs";
import path from "path";

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

export const config = yaml.load(yamlContent) as Config;

type Config = {
    server: {
        port: number;
        env: string;
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
            redirect_uri: string;
        };
        apple: {
            enable: boolean;
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
    };
    whiteboard: {
        access_key: string;
        secret_access_key: string;
        convert_region: "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon";
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
};

interface SMSConfig {
    access_id: string;
    access_secret: string;
    template_code: string;
    sign_name: string;
}
