import { LoginStaticType } from "../abstract/login/Type";

export const Login = (): ((target: LoginStaticType) => void) => {
    return (_target: LoginStaticType): void => {};
};
