// @ts-ignore
import inspector from "schema-inspector";

import { PatchRequest, RestifyRoutes } from "../v1/types/Server";
import { Next, Response } from "restify";
import { invalidContentError } from "../v1/utils/Errors";

export const httpValidation = (rules: any, handle: RestifyRoutes["handle"]) => {
    return (req: PatchRequest, res: Response, next: Next): RestifyRoutes["handle"] | void => {
        if (typeof rules.query !== "undefined") {
            const result = inspector.validate(rules.query, req.query);

            if (!result.valid) {
                invalidContentError(res, result.format());
                return next(new Error());
            }
        }

        if (typeof rules.params !== "undefined") {
            const result = inspector.validate(rules.params, req.params);

            if (!result.valid) {
                invalidContentError(res, result.format());
                return next(new Error());
            }
        }

        if (typeof rules.body !== "undefined") {
            const result = inspector.validate(rules.body, req.body);

            if (!result.valid) {
                invalidContentError(res, result.format());
                return next(new Error());
            }
        }

        return handle(req, res, next);
    };
};

export const socketValidation = (
    rules: any,
    checkObj: AnyObj,
): { status: true } | { status: false; message: string } => {
    const result = inspector.validate(rules, checkObj);

    if (result.valid) {
        return {
            status: result.valid,
        };
    }

    return {
        status: result.valid,
        message: result.format(),
    };
};
