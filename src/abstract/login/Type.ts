import { AbstractLogin } from "./index";

export type LoginClass = new (params: LoginClassParams) => AbstractLogin;

export interface LoginStaticType extends LoginClass {
    getToken(...args: any[]): Promise<any>;
    getUserInfoByAPI(...args: any[]): Promise<any>;
}

export type LoginClassParams<T = any> = {
    userUUID: string;
} & T;
