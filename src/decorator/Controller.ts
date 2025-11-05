import { RouterMetadata } from "./Metadata";
import { ControllerStaticType } from "../abstract/controller";

export const Controller = <RES, REQ>(
    params: ControllerParams,
): ((target: ControllerStaticType<RES, REQ>) => void) => {
    const { path, method, auth, ipblock, skipAutoHandle, enable } = params;

    return (target: ControllerStaticType<RES, REQ>): void => {
        Reflect.defineMetadata(RouterMetadata.PATH, path, target);
        Reflect.defineMetadata(RouterMetadata.METHOD, method, target);
        Reflect.defineMetadata(RouterMetadata.AUTH, auth, target);
        Reflect.defineMetadata(RouterMetadata.IPBLOCK, ipblock || false, target);
        Reflect.defineMetadata(RouterMetadata.SKIP_AUTO_HANDLE, skipAutoHandle || false, target);
        Reflect.defineMetadata(RouterMetadata.ENABLE, enable ?? true, target);
    };
};

export type ControllerParams = {
    path: string | string[];
    method: "get" | "post";
    auth: boolean;
    ipblock?: boolean;
    skipAutoHandle?: boolean;
    enable?: boolean;
};
