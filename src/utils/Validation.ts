import errors from "restify-errors";
import { HTTPValidationRules, RestifyRoutes, SocketValidationRules } from "../v1/types/Server";
import { Next, Request, Response } from "restify";

const validation = (
    rules: string[] | AnyObj,
    checkObj: AnyObj,
    illegalStr?: string,
): Validation => {
    const ruleKeys: string[] = Array.isArray(rules) ? rules : Object.keys(rules);
    for (let i = 0; i < ruleKeys.length; i++) {
        const key = ruleKeys[i];
        if (typeof checkObj[key] === "undefined" || checkObj[key] === "") {
            return {
                status: false,
                problemKey: key,
                problemType: "miss",
            };
        }

        if (illegalStr && String(checkObj[key]).includes(illegalStr)) {
            return {
                status: false,
                problemKey: key,
                problemType: "illegal",
            };
        }
    }

    return {
        status: true,
        problemKey: "",
        problemType: "",
    };
};

export const httpValidation = (rules: HTTPValidationRules, handle: RestifyRoutes["handle"]) => {
    return (req: Request, res: Response, next: Next): RestifyRoutes["handle"] | void => {
        if (typeof rules.query !== "undefined") {
            const { status, problemKey } = validation(rules.query, req.query);
            if (!status) {
                return next(new errors.InvalidVersionError({}, `Missing query key: ${problemKey}`));
            }
        }

        if (typeof rules.params !== "undefined") {
            const { status, problemKey } = validation(rules.params, req.params);
            if (!status) {
                return next(
                    new errors.InvalidVersionError({}, `Missing parameters: ${problemKey}`),
                );
            }
        }

        if (typeof rules.body !== "undefined") {
            const { status, problemKey } = validation(rules.body, req.body);
            if (!status) {
                return next(new errors.InvalidVersionError({}, `Missing body key: ${problemKey}`));
            }
        }

        return handle(req, res, next);
    };
};

export const socketValidation = (
    rules: SocketValidationRules,
    checkObj: AnyObj,
): { status: true } | { status: false; message: string } => {
    const { status, problemKey, problemType } = validation(rules, checkObj, ":");

    if (status) {
        return {
            status,
        };
    }

    return {
        status,
        message:
            problemType === "miss"
                ? `Missing parameters: ${problemKey}`
                : `Illegal Parameter: ${problemKey}`,
    };
};

type Validation = {
    status: boolean;
    problemKey: string;
    problemType: "" | "miss" | "illegal";
};
