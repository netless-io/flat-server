import path from "path";
import { FError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { FileResourceType, ossResourceType } from "../../../../../model/cloudStorage/Constants";
import { FilesInfo } from "../../info.type";

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

export const pathPrefixMatch = (filesInfo: FilesInfo, directoryPath: string): FilesInfo => {
    const result: FilesInfo = new Map();
    filesInfo.forEach((fileInfo, fileUUID) => {
        if (fileInfo.directoryPath.startsWith(directoryPath)) {
            result.set(fileUUID, fileInfo);
        }
    });

    return result;
};

export const calculateDirectoryMaxDeep = (
    filesInfo: FilesInfo,
    fullDirectoryPath: string,
): number => {
    if (filesInfo.size === 0) {
        return 0;
    }

    let maxLength = 0;
    filesInfo.forEach(fileInfo => {
        maxLength = Math.max(maxLength, fileInfo.directoryPath.length);
    });

    return maxLength - fullDirectoryPath.length;
};

export const calculateFilesSize = (filesInfo: FilesInfo): number => {
    let size = 0;
    filesInfo.forEach(fileInfo => {
        if (ossResourceType.includes(fileInfo.resourceType)) {
            size += fileInfo.fileSize;
        }
    });

    return size;
};

export const clearUUIDs = (filesInfo: FilesInfo, uuids: string[]): ClearUUIDs => {
    let originDirectoryPath = "";
    const files: FilesInfo = new Map();
    const dirs: FilesInfo = new Map();

    for (const uuid of uuids) {
        const fileInfo = filesInfo.get(uuid);
        if (fileInfo === undefined) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        if (originDirectoryPath === "") {
            originDirectoryPath = fileInfo.directoryPath;
        }

        if (originDirectoryPath !== fileInfo.directoryPath) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        if (fileInfo.resourceType === FileResourceType.Directory) {
            dirs.set(uuid, fileInfo);
        } else {
            files.set(uuid, fileInfo);
        }
    }

    return {
        dirs,
        files,
        originDirectoryPath,
    };
};

interface SplitPath {
    parentDirectoryPath: string;
    directoryName: string;
}

type ClearUUIDs = {
    dirs: FilesInfo;
    files: FilesInfo;
    originDirectoryPath: string;
};
