import path from "path";
import { FError } from "../../../../../error/ControllerError";
import { ErrorCode } from "../../../../../ErrorCode";
import { FilesInfoBasic } from "../../directory.type";
import { FileResourceType } from "../../../../../model/cloudStorage/Constants";

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

export const pathPrefixMatch = (
    filesInfo: FilesInfoBasic[],
    directoryPath: string,
): FilesInfoBasic[] => {
    return filesInfo.filter(fileInfo => {
        return fileInfo.directoryPath.startsWith(directoryPath);
    });
};

export const calculateDirectoryMaxDeep = (
    filesInfo: FilesInfoBasic[],
    directoryPath: string,
    directoryName: string,
): number => {
    // not subDirectory
    if (filesInfo.length === 0) {
        // aaa => aaa/
        return directoryName.length + 1;
    }

    /**
     * directoryPath: /a/
     * directoryName: b
     * fullDirectoryPath: /a/b/c/d/e/
     * directory_path: /a/b/c/d/
     * file_name: e
     * maxLength: (directory_path + file_name) = /a/b/c/d/e
     * maxLength.length - directoryPath.length = /a/b/c/d/e - /a/ = b/c/d/e
     */
    return (
        filesInfo.reduce((acc, item) => {
            let deep = (item.directoryPath + item.fileName).length;
            // if is directory, suffix is /. So we need to add 1: ('b/c/d/e' + '/').length
            if (item.resourceType === FileResourceType.Directory) {
                deep += 1;
            }

            return Math.max(acc, deep);
        }, 0) - directoryPath.length
    );
};

export const filesSeparator = (
    filesInfo: FilesInfoBasic[],
    directoryPath: string,
    directoryName: string,
): FilesSeparatorReturn => {
    let currentDirectoryUUID = "";
    const subFilesAndDirUUID: string[] = [];

    for (const item of filesInfo) {
        if (
            item.directoryPath === directoryPath &&
            item.fileName === directoryName &&
            item.resourceType === FileResourceType.Directory
        ) {
            currentDirectoryUUID = item.fileUUID;
        } else if (item.directoryPath.startsWith(`${directoryPath}${directoryName}/`)) {
            subFilesAndDirUUID.push(item.fileUUID);
        }
    }

    return {
        currentDirectoryUUID,
        subFilesAndDirUUID,
    };
};

export const aggregationsFilesInfo = (
    filesInfo: FilesInfoBasic[],
    uuids: string[],
): AggregationsFilesInfo => {
    const data: AggregationsFilesInfo = {};

    const filesInfoUUID = new Set(filesInfo.map(item => item.fileUUID));

    for (const uuid of uuids) {
        if (!filesInfoUUID.has(uuid)) {
            throw new FError(ErrorCode.ParamsCheckFailed);
        }

        for (const fileInfo of filesInfo) {
            if (fileInfo.fileUUID === uuid) {
                if (data[fileInfo.directoryPath] === undefined) {
                    data[fileInfo.directoryPath] = {
                        dir: [],
                        files: [],
                    };
                }

                if (fileInfo.resourceType === FileResourceType.Directory) {
                    if (!data[fileInfo.directoryPath].dir.includes(fileInfo.fileName)) {
                        data[fileInfo.directoryPath].dir.push(fileInfo.fileName);
                    }
                } else {
                    if (!data[fileInfo.directoryPath].files.includes(fileInfo.fileUUID)) {
                        data[fileInfo.directoryPath].files.push(fileInfo.fileUUID);
                    }
                }
            }
        }
    }

    return data;
};

interface SplitPath {
    parentDirectoryPath: string;
    directoryName: string;
}

interface FilesSeparatorReturn {
    currentDirectoryUUID: string;
    subFilesAndDirUUID: string[];
}

type AggregationsFilesInfo = Record<
    string,
    {
        dir: string[];
        files: string[];
    }
>;
