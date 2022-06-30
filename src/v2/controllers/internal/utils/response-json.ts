import { ResponseError, ResponseSuccess } from "../../../../types/Server";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

export const successJSON = <O>(data: O): ResponseSuccess<O> => {
    return {
        status: Status.Success,
        data,
    };
};

export const failJSON = (code: ErrorCode): ResponseError => {
    return {
        status: Status.Failed,
        code,
    };
};
