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
    };
    redis: {
        host: string;
        port: number;
        username: string | null;
        password: string;
        db: number;
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
        url_file_suffix: string[];
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
    };
    whiteboard: {
        access_key: string;
        secret_access_key: string;
    };
    storage_service: {
        type: "oss";
        oss: {
            zh_hz: {
                access_key: string;
                secret_key: string;
                endpoint: string;
                bucket: string;
                region: string;
            };
            us_sv: {
                access_key: string;
                secret_key: string;
                endpoint: string;
                bucket: string;
                region: string;
            };
            sg: {
                access_key: string;
                secret_key: string;
                endpoint: string;
                bucket: string;
                region: string;
            };
            in_mum: {
                access_key: string;
                secret_key: string;
                endpoint: string;
                bucket: string;
                region: string;
            };
            gb_lon: {
                access_key: string;
                secret_key: string;
                endpoint: string;
                bucket: string;
                region: string;
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
