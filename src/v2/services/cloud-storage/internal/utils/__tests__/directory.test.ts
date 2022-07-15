import test from "ava";
import { splitPath } from "../directory";
import { FError } from "../../../../../../error/ControllerError";
import { Status } from "../../../../../../constants/Project";
import { ErrorCode } from "../../../../../../ErrorCode";

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
