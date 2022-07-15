import path from "path";
import { FError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";

export const splitPath = (p: string): SplitPath => {
    if (!p.startsWith("/")) {
        throw new FError(ErrorCode.ParamsCheckFailed);
    }

    if (path.normalize(p) !== p) {
        throw new FError(ErrorCode.ParamsCheckFailed);
    }

    const name = p.match(/([^/]+)\/$/);
    if (name === null) {
        throw new FError(ErrorCode.ParamsCheckFailed);
    }

    const parentDirectoryPath = p.replace(/[^/]+\/$/, "");

    return {
        parentDirectoryPath,
        directoryName: name[1],
    };
};

interface SplitPath {
    parentDirectoryPath: string;
    directoryName: string;
}
