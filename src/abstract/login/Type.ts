import { AbstractLogin } from "./";

export type LoginClass = new (params: LoginClassParams) => AbstractLogin;

export interface LoginStaticType extends LoginClass {
    getToken(...args: any[]): Promise<any>;
    getUserInfoByAPI(...args: any[]): Promise<any>;
}

export interface LoginClassParams {
    userUUID: string;
}
