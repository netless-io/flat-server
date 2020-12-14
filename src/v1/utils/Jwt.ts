import { Algorithm, verify } from "jsonwebtoken";
import { Next, Request, Response } from "restify";
import { JWT } from "../../Constants";
import { invalidContentError, invalidCredentialsError, unauthorizedError } from "./Errors";

export const jwtVerify = (options: Options) => {
    return (req: Request, res: Response, next: Next): void => {
        const routePath = req.getRoute().path;

        if (options.skipAuthRoute?.includes(routePath)) {
            return next();
        }

        const authorization = req.header("Authorization");

        if (authorization === undefined || authorization.trim() === "") {
            invalidCredentialsError(res, "No authorization token was found");
            return next(new Error());
        }

        const [scheme, credentials] = authorization.split(" ");
        if (scheme !== "Bearer" || credentials === undefined) {
            invalidCredentialsError(res, "Authorization format error");
            return next(new Error());
        }

        if (req.method === "OPTIONS") {
            return next();
        }

        verify(
            credentials,
            JWT.SECRET,
            {
                algorithms: [JWT.ALGORITHMS] as Algorithm[],
            },
            (err, decoded) => {
                if (err) {
                    err.name === "TokenExpiredError"
                        ? unauthorizedError(res, "The token has expired")
                        : invalidCredentialsError(res, err.message);
                    return next(new Error());
                }

                if (
                    typeof decoded === "undefined" ||
                    // @ts-ignore
                    typeof decoded.userID === "undefined" ||
                    // @ts-ignore
                    !["WeChat"].includes(decoded.loginSource)
                ) {
                    invalidContentError(res, "JWT payload content error");
                    return next(new Error());
                }

                // @ts-ignore
                req["user"] = decoded;
                next();
            },
        );
    };
};

type Options = {
    skipAuthRoute?: (string | RegExp)[];
};
