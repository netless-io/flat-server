import { UserModel } from "./user/User";
import { UserWeChatModel } from "./user/WeChat";
import { UserGithubModel } from "./user/Github";
import { UserAppleModel } from "./user/Apple";
import { UserAgoraModel } from "./user/Agora";
import { UserGoogleModel } from "./user/Google";
import { UserPhoneModel } from "./user/Phone";
import { RoomModel } from "./room/Room";
import { RoomUserModel } from "./room/RoomUser";
import { RoomPeriodicConfigModel } from "./room/RoomPeriodicConfig";
import { RoomPeriodicModel } from "./room/RoomPeriodic";
import { RoomPeriodicUserModel } from "./room/RoomPeriodicUser";
import { RoomRecordModel } from "./room/RoomRecord";
import { CloudStorageFilesModel } from "./cloudStorage/CloudStorageFiles";
import { CloudStorageUserFilesModel } from "./cloudStorage/CloudStorageUserFiles";
import { CloudStorageConfigsModel } from "./cloudStorage/CloudStorageConfigs";
import { OAuthInfosModel } from "./oauth/oauth-infos";
import { OAuthSecretsModel } from "./oauth/oauth-secrets";
import { OAuthUsersModel } from "./oauth/oauth-users";
import { UserSensitiveModel } from "./user/Sensitive";
import { UserEmailModel } from "./user/Email";
import { UserPmiModel } from "./user/Pmi";
import { UserAgreementModel } from "./user/Agreement";
import { PartnerModel } from "./partner/Partner";
import { PartnerRoomModel } from "./partner/PartnerRoom";

export type Model =
    | UserModel
    | UserWeChatModel
    | UserGithubModel
    | UserAppleModel
    | UserAgoraModel
    | UserGoogleModel
    | UserPhoneModel
    | UserEmailModel
    | UserSensitiveModel
    | UserPmiModel
    | UserAgreementModel
    | RoomModel
    | RoomUserModel
    | RoomPeriodicConfigModel
    | RoomPeriodicModel
    | RoomPeriodicUserModel
    | RoomRecordModel
    | CloudStorageFilesModel
    | CloudStorageUserFilesModel
    | CloudStorageConfigsModel
    | OAuthInfosModel
    | OAuthSecretsModel
    | OAuthUsersModel
    | PartnerModel
    | PartnerRoomModel;
