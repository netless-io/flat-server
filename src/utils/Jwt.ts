const errors = require("restify-errors");
import { Algorithm, verify } from "jsonwebtoken";
import { Next, Request, Response } from "restify";
import { JWT } from "../Constants";

export const jwtVerify = (options: Options) => {
    return (req: Request, _res: Response, next: Next): void => {
        const routePath = req.getRoute().path;

        if (options.skipAuthRoute?.includes(routePath)) {
            return next();
        }

        const authorization = req.header("Authorization");

        if (authorization === undefined || authorization.trim() === "") {
            return next(new errors.InvalidCredentialsError("No authorization token was found"));
        }

        const [scheme, credentials] = authorization.split(" ");
        if (scheme !== "Bearer" || credentials === undefined) {
            return next(new errors.InvalidCredentialsError("Authorization format error"));
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
                    return err.name === "TokenExpiredError"
                        ? next(new errors.UnauthorizedError("The token has expired"))
                        : next(new errors.InvalidCredentialsError(err));
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
