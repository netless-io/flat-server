import test from "ava";
import {
    aggregationsFilesInfo,
    calculateDirectoryMaxDeep,
    filesSeparator,
    pathPrefixMatch,
    splitPath,
} from "../directory";
import { FError } from "../../../../../../error/ControllerError";
import { Status } from "../../../../../../constants/Project";
import { ErrorCode } from "../../../../../../ErrorCode";
import { FileResourceType } from "../../../../../../model/cloudStorage/Constants";
import { FilesInfoBasic } from "../../../directory.type";
import { v4 } from "uuid";

const namespace = "services.cloud-storage.utils.directory";

test(`${namespace} - splitPath`, ava => {
    ava.throws(() => splitPath("/"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    ava.throws(() => splitPath("/a/b"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    ava.throws(() => splitPath("a/b/"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    ava.throws(() => splitPath("////a/b/c/"), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });

    {
        const { parentDirectoryPath, directoryName } = splitPath("/a/b/c/");
        ava.is(parentDirectoryPath, "/a/b/");
        ava.is(directoryName, "c");
    }
});

test(`${namespace} - pathPrefixMatch`, ava => {
    const filesInfo: FilesInfoBasic[] = [
        {
            directoryPath: "/a/b/c/",
            fileName: "d",
            resourceType: FileResourceType.Directory,
            fileUUID: v4(),
        },
        {
            directoryPath: "/a/b/c/",
            fileName: "e",
            resourceType: FileResourceType.WhiteboardProjector,
            fileUUID: v4(),
        },
        {
            directoryPath: "/x/b/c/",
            fileName: "f",
            resourceType: FileResourceType.LocalCourseware,
            fileUUID: v4(),
        },
    ];
    const result = pathPrefixMatch(filesInfo, "/a/");

    ava.deepEqual(result, result.slice(0, 2));
});

test(`${namespace} - calculateDirectoryMaxDeep`, ava => {
    const result = calculateDirectoryMaxDeep(
        [
            {
                directoryPath: "/a/b/c/",
                fileName: "a",
                resourceType: FileResourceType.Directory,
                fileUUID: v4(),
            },
            {
                directoryPath: "/a/b/c/",
                fileName: "xx",
                resourceType: FileResourceType.Directory,
                fileUUID: v4(),
            },
            {
                directoryPath: "/a/b/c/",
                fileName: "yy",
                resourceType: FileResourceType.WhiteboardConvert,
                fileUUID: v4(),
            },
        ],
        "/",
        "a",
    );

    ava.is(result, "a/b/c/xx/".length);
});

test(`${namespace} - calculateDirectoryMaxDeep - filesInfo is empty array`, ava => {
    const result = calculateDirectoryMaxDeep([], "/", "a");

    ava.is(result, "a/".length);
});

test(`${namespace} - filesSeparator`, ava => {
    const filesInfo: FilesInfoBasic[] = [
        {
            directoryPath: "/",
            resourceType: FileResourceType.Directory,
            fileName: "a",
            fileUUID: v4(),
        },
        {
            directoryPath: "/a/",
            resourceType: FileResourceType.OnlineCourseware,
            fileName: "b",
            fileUUID: v4(),
        },
    ];
    const result = filesSeparator(filesInfo, "/", "a");

    ava.is(result.currentDirectoryUUID, filesInfo[0].fileUUID);
    ava.deepEqual(result.subFilesAndDirUUID, [filesInfo[1].fileUUID]);
});

test(`${namespace} - aggregationsFilesInfo`, ava => {
    const filesInfo: FilesInfoBasic[] = [
        {
            directoryPath: "/",
            resourceType: FileResourceType.WhiteboardProjector,
            fileUUID: v4(),
            fileName: v4(),
        },
        {
            directoryPath: "/",
            resourceType: FileResourceType.WhiteboardProjector,
            fileUUID: v4(),
            fileName: v4(),
        },
        {
            directoryPath: "/",
            resourceType: FileResourceType.Directory,
            fileUUID: v4(),
            fileName: v4(),
        },
        {
            directoryPath: "/a/",
            resourceType: FileResourceType.Directory,
            fileUUID: v4(),
            fileName: v4(),
        },
    ];

    const result = aggregationsFilesInfo(
        filesInfo,
        filesInfo.map(item => item.fileUUID),
    );
    ava.deepEqual(result, {
        "/": {
            files: [filesInfo[0].fileUUID, filesInfo[1].fileUUID],
            dir: [filesInfo[2].fileName],
        },
        "/a/": {
            files: [],
            dir: [filesInfo[3].fileName],
        },
    });
});

test(`${namespace} - aggregationsFilesInfo - has same fileUUID`, ava => {
    const filesInfo: FilesInfoBasic[] = [
        {
            directoryPath: "/",
            resourceType: FileResourceType.WhiteboardProjector,
            fileUUID: v4(),
            fileName: v4(),
        },
        {
            directoryPath: "/",
            resourceType: FileResourceType.NormalResources,
            fileUUID: v4(),
            fileName: v4(),
        },
    ];

    const result = aggregationsFilesInfo(filesInfo, [filesInfo[0].fileUUID, filesInfo[0].fileUUID]);

    ava.deepEqual(result, {
        "/": {
            dir: [],
            files: [filesInfo[0].fileUUID],
        },
    });
});

test(`${namespace} - aggregationsFilesInfo - fileUUID not found`, ava => {
    const filesInfo: FilesInfoBasic[] = [
        {
            directoryPath: "/",
            resourceType: FileResourceType.WhiteboardProjector,
            fileUUID: v4(),
            fileName: v4(),
        },
        {
            directoryPath: "/",
            resourceType: FileResourceType.NormalResources,
            fileUUID: v4(),
            fileName: v4(),
        },
    ];

    ava.throws(() => aggregationsFilesInfo(filesInfo, [filesInfo[0].fileUUID, v4()]), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});
