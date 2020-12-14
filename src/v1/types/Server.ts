import { Next, Request, Response } from "restify";

export interface PatchRequest extends Request {
    user: {
        id: string;
        source: "WeChat";
    };
}

export type RestifyRoutes = Readonly<{
    readonly method: "get" | "post";
    readonly auth: boolean;
    readonly path: string;
    readonly handle: (req: PatchRequest, res: Response, next: Next) => void;
}>;

export type IOServer = import("socket.io").Server;
export type IOSocket = import("socket.io").Socket;
export type IONsp = import("socket.io").Namespace;
export type IORoutes = Readonly<{
    readonly nsp: string;
    readonly handle: (socket: IOSocket) => void;
}>;

export type SocketNamespaces = {
    [key in IORoutes["nsp"]]: IONsp;
};
