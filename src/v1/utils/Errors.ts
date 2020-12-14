import { Response } from "restify";

export const invalidCredentialsError = (resp: Response, message: string): void => {
    resp.send(401, {
        status: false,
        name: "InvalidCredentialsError",
        message,
    });
};

export const unauthorizedError = (resp: Response, message: string): void => {
    resp.send(401, {
        status: false,
        name: "UnauthorizedError",
        message,
    });
};

export const invalidContentError = (resp: Response, message: string): void => {
    resp.send(400, {
        status: false,
        name: "InvalidContentError",
        message,
    });
};
