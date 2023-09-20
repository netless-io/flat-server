import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ServiceUser } from "../../../service/user/User";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceUserApple } from "../../../service/user/UserApple";
import NodeRSA from "node-rsa";
import jwt, { Algorithm } from "fast-jwt";
import { ax } from "../../../utils/Axios";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { Apple } from "../../../../constants/Config";

@Login()
export class LoginApple extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userApple: new ServiceUserApple(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserApple = this.svc.userApple.create(info, t);

            return await Promise.all([createUser, createUserApple, this.setGuidePPTX(this.svc, t)]);
        });
    }

    public static async assertJWTTokenCorrect(jwtToken: string): Promise<void> {
        const token = jwt.createDecoder({
            complete: true,
        })(jwtToken) as AppleJWTToken | null;
        if (token === null) {
            throw new Error("jwt format parse failed");
        }

        const keys = (await ax.get<AppleKeys>("https://appleid.apple.com/auth/keys")).data.keys;

        const authKey = keys.filter(k => k.kid === token.header.kid)[0];

        if (authKey === undefined) {
            throw new Error("apple auth key mismatch");
        }

        const rsa = new NodeRSA();
        rsa.importKey(
            {
                n: Buffer.from(authKey.n, "base64"),
                e: Buffer.from(authKey.e, "base64"),
            },
            "components-public",
        );
        const key = rsa.exportKey("public");

        jwt.createVerifier({
            key,
            algorithms: [token.header.alg],
            allowedAud: Apple.aud,
        })(jwtToken);
    }

    public static getToken(): Promise<void> {
        throw new Error("no support getToken method in apple");
    }

    public static getUserInfoByAPI(): Promise<void> {
        throw new Error("no support getUserInfoByAPI method in apple");
    }
}

interface RegisterService {
    user: ServiceUser;
    userApple: ServiceUserApple;
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
}

export interface AppleJWTToken {
    header: {
        kid: string;
        alg: Algorithm;
    };
    payload: {
        sub: string;
        aud: string;
    };
}

interface AppleKeys {
    keys: Array<{
        kty: string;
        kid: string;
        use: string;
        alg: string;
        n: string;
        e: string;
    }>;
}
