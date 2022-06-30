import { ErrorCode } from "../ErrorCode";
import { FlatError } from "./FlatError";
import { ResponseError } from "../types/Server";
import { Status } from "../constants/Project";

export class ControllerError extends FlatError {
    constructor(
        public errorCode: ErrorCode,
        public status: ResponseError["status"] = Status.Failed,
    ) {
        super(`${status}: ${errorCode}`);
        this.name = "ControllerError";
    }
}

export class FError extends FlatError {
    constructor(
        public errorCode: ErrorCode,
        public status: ResponseError["status"] = Status.Failed,
    ) {
        super(`${status}: ${errorCode}`);
    }
}
