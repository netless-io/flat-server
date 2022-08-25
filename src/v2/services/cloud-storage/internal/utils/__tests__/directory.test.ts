import test from "ava";
import {
    calculateDirectoryMaxDeep,
    calculateFilesSize,
    clearUUIDs,
    pathPrefixMatch,
    splitPath,
} from "../directory";
import { FError } from "../../../../../../error/ControllerError";
import { Status } from "../../../../../../constants/Project";
import { ErrorCode } from "../../../../../../ErrorCode";
import { FileResourceType } from "../../../../../../model/cloudStorage/Constants";
import { v4 } from "uuid";
import { FilesInfo } from "../../../info.type";

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
    const [u1, u2, u3] = [v4(), v4(), v4()];
    const filesInfo: FilesInfo = new Map();
    filesInfo.set(u1, {
        directoryPath: "/a/b/c/",
        fileName: "d",
        resourceType: FileResourceType.Directory,
        fileURL: v4(),
        fileSize: 0,
    });
    filesInfo.set(u2, {
        directoryPath: "/a/b/c/",
        fileName: "e",
        resourceType: FileResourceType.WhiteboardProjector,
        fileURL: v4(),
        fileSize: 0,
    });
    filesInfo.set(u3, {
        directoryPath: "/x/b/c/",
        fileName: "f",
        resourceType: FileResourceType.NormalResources,
        fileURL: v4(),
        fileSize: 0,
    });
    const result = pathPrefixMatch(filesInfo, "/a/");

    ava.is(result.size, 2);

    ava.is(result.get(u1)!.fileName, "d");
    ava.is(result.get(u2)!.fileName, "e");
});

test(`${namespace} - calculateDirectoryMaxDeep`, ava => {
    const filesInfo: FilesInfo = new Map();
    filesInfo.set(v4(), {
        directoryPath: "/a/b/c/d",
        fileName: "a",
        resourceType: FileResourceType.Directory,
        fileSize: 0,
        fileURL: v4(),
    });
    filesInfo.set(v4(), {
        directoryPath: "/a/b/c/d/e",
        fileName: "xx",
        resourceType: FileResourceType.Directory,
        fileSize: 0,
        fileURL: v4(),
    });
    filesInfo.set(v4(), {
        directoryPath: "/a/b/c/d/e/f/",
        fileName: "yy",
        resourceType: FileResourceType.WhiteboardConvert,
        fileSize: 0,
        fileURL: v4(),
    });
    const result = calculateDirectoryMaxDeep(filesInfo, "/a/");

    ava.is(result, "b/c/d/e/f/".length);
});

test(`${namespace} - calculateDirectoryMaxDeep - filesInfo is empty array`, ava => {
    const result = calculateDirectoryMaxDeep(new Map(), "/a/");

    ava.is(result, 0);
});

test(`${namespace} - clearUUIDs - not found info in filesInfo`, ava => {
    ava.throws(() => clearUUIDs(new Map(), [v4()]), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - clearUUIDs - directoryPath not same`, ava => {
    const [u1, u2] = [v4(), v4()];
    const filesInfo: FilesInfo = new Map();
    filesInfo.set(u1, {
        directoryPath: "/",
        resourceType: FileResourceType.Directory,
        fileURL: v4(),
        fileSize: 0,
        fileName: v4(),
    });
    filesInfo.set(u2, {
        directoryPath: "/a/",
        resourceType: FileResourceType.Directory,
        fileURL: v4(),
        fileSize: 0,
        fileName: v4(),
    });

    ava.throws(() => clearUUIDs(filesInfo, [u1, u2]), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.ParamsCheckFailed}`,
    });
});

test(`${namespace} - clearUUIDs`, ava => {
    const [u1, u2] = [v4(), v4()];
    const filesInfo: FilesInfo = new Map();
    filesInfo.set(u1, {
        directoryPath: "/",
        resourceType: FileResourceType.Directory,
        fileURL: v4(),
        fileSize: 0,
        fileName: v4(),
    });
    filesInfo.set(u2, {
        directoryPath: "/",
        resourceType: FileResourceType.NormalResources,
        fileURL: v4(),
        fileSize: 0,
        fileName: v4(),
    });

    const { dirs, files, originDirectoryPath } = clearUUIDs(filesInfo, [u1, u2]);

    ava.is(dirs.size, 1);
    ava.is(files.size, 1);
    ava.is(originDirectoryPath, "/");
});

test(`${namespace} - calculateFilesSize`, ava => {
    const filesInfo = new Map();
    filesInfo.set(v4(), {
        resourceType: FileResourceType.Directory,
        fileSize: 12,
    });
    filesInfo.set(v4(), {
        resourceType: FileResourceType.NormalResources,
        fileSize: 20,
    });
    filesInfo.set(v4(), {
        resourceType: FileResourceType.WhiteboardProjector,
        fileSize: 2,
    });
    filesInfo.set(v4(), {
        resourceType: FileResourceType.WhiteboardConvert,
        fileSize: 3,
    });
    const result = calculateFilesSize(filesInfo);

    ava.is(result, 20 + 2 + 3);
});
