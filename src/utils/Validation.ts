// @ts-ignore
import inspector from "schema-inspector";

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
