import { Type } from "@sinclair/typebox";

export enum Status {
    NoLogin = -1,
    Success,
    Failed,
    Process,
    AuthFailed,
}

export enum LoginPlatform {
    WeChat = "WeChat",
    Github = "Github",
    Apple = "Apple",
    Agora = "Agora",
    Google = "Google",
    Phone = "Phone",
    Email = "Email",
}

export enum Gender {
    Man = "Man",
    Woman = "Woman",
    None = "None",
}

export enum Region {
    CN_HZ = "cn-hz",
    US_SV = "us-sv",
    SG = "sg",
    IN_MUM = "in-mum",
    GB_LON = "gb-lon",
}

export const RegionSchema = Type.String({
    enum: [Region.CN_HZ, Region.SG, Region.GB_LON, Region.IN_MUM, Region.US_SV],
});
