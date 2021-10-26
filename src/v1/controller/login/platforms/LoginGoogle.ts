import { Login } from "../../../../decorator/Login";
import { AbstractLogin } from "../../../../abstract/login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ServiceUser } from "../../../service/user/User";
import { ServiceUserGoogle } from "../../../service/user/UserGoogle";
import { getConnection } from "typeorm";
import { ax } from "../../../utils/Axios";
import { Google } from "../../../../constants/Process";
import { URLSearchParams } from "url";

@Login()
export class LoginGoogle extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userGoogle: new ServiceUserGoogle(this.userUUID),
        };
    }

    public async register(info: RegisterInfo): Promise<void> {
        await getConnection().transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserGoogle = this.svc.userGoogle.create(info, t);

            return await Promise.all([createUser, createUserGoogle]);
        });
    }

    public static async getToken(code: string): Promise<string> {
        const response = await ax.post<AccessToken>(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: Google.CLIENT_ID,
                client_secret: Google.CLIENT_SECRET,
                redirect_uri: Google.REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        );

        const { access_token, token_type } = response.data;

        return `${token_type} ${access_token}`;
    }

    public static async getUserInfoByAPI(authorization: string): Promise<GoogleUserInfo> {
        const response = await ax.get<GoogleUserResponse>(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
                headers: {
                    Authorization: authorization,
                },
            },
        );

        const { id, picture, given_name } = response.data;

        return {
            unionUUID: id,
            avatarURL: picture,
            userName: given_name,
        };
    }

    public static async getUserInfoAndToken(
        code: string,
    ): Promise<GoogleUserInfo & { accessToken: string }> {
        const accessToken = await LoginGoogle.getToken(code);
        const userInfo = await LoginGoogle.getUserInfoByAPI(accessToken);

        return {
            ...userInfo,
            accessToken,
        };
    }
}

interface RegisterService {
    user: ServiceUser;
    userGoogle: ServiceUserGoogle;
}

interface RegisterInfo {
    userName: string;
    avatarURL: string;
    unionUUID: string;
}

interface AccessToken {
    token_type: string;
    access_token: string;
}

type GoogleUserInfo = RegisterInfo;

interface GoogleUserResponse {
    id: string;
    picture: string;
    given_name: string;
}
