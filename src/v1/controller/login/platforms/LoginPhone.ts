import { AbstractLogin } from "../../../../abstract/login";
import { Login } from "../../../../decorator/Login";
import { LoginClassParams } from "../../../../abstract/login/Type";
import { ServiceUser } from "../../../service/user/User";
import { ServiceCloudStorageFiles } from "../../../service/cloudStorage/CloudStorageFiles";
import { ServiceCloudStorageConfigs } from "../../../service/cloudStorage/CloudStorageConfigs";
import { ServiceCloudStorageUserFiles } from "../../../service/cloudStorage/CloudStorageUserFiles";
import { ServiceUserPhone } from "../../../service/user/UserPhone";
import { dataSource } from "../../../../thirdPartyService/TypeORMService";
import { ServiceUserSensitive } from "../../../service/user/UserSensitive";

@Login()
export class LoginPhone extends AbstractLogin {
    public readonly svc: RegisterService;

    constructor(params: LoginClassParams) {
        super(params);

        this.svc = {
            user: new ServiceUser(this.userUUID),
            userPhone: new ServiceUserPhone(this.userUUID),
            userSensitive: new ServiceUserSensitive(this.userUUID),
            cloudStorageFiles: new ServiceCloudStorageFiles(),
            cloudStorageConfigs: new ServiceCloudStorageConfigs(this.userUUID),
            cloudStorageUserFiles: new ServiceCloudStorageUserFiles(this.userUUID),
        };
    }

    public async register(data: RegisterInfo): Promise<void> {
        const info = {
            ...data,
            userName: data.phone.slice(-4),
        };
        await dataSource.transaction(async t => {
            const createUser = this.svc.user.create(info, t);

            const createUserPhone = this.svc.userPhone.create(info, t);
            const createUserSensitive = this.svc.userSensitive.phone(info, t);

            return await Promise.all([
                createUser,
                createUserPhone,
                createUserSensitive,
                this.setGuidePPTX(this.svc, t),
            ]);
        });
    }

    public static getToken(_code: string): any {
        throw new Error("not achieved");
    }

    public static getUserInfoByAPI(_token: any): any {
        throw new Error("not achieved");
    }
}

interface RegisterService {
    user: ServiceUser;
    userPhone: ServiceUserPhone;
    userSensitive: ServiceUserSensitive;
    cloudStorageFiles: ServiceCloudStorageFiles;
    cloudStorageUserFiles: ServiceCloudStorageUserFiles;
    cloudStorageConfigs: ServiceCloudStorageConfigs;
}

interface RegisterInfo {
    avatarURL: string;
    phone: string;
}
