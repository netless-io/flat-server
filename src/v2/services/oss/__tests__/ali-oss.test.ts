import test from "ava";
import sinon, { SinonStub } from "sinon";
import { aliOSSClient } from "../ali-oss-client";
import { AliOSSService } from "../ali-oss";
import { v4 } from "uuid";
import { ids } from "../../../__tests__/helpers/fastify/ids";
import { StorageService } from "../../../../constants/Config";
import { FError } from "../../../../error/ControllerError";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

const namespace = "v2.services.oss.ali-oss";

let deleteStub: SinonStub;
let deleteMultiStub: SinonStub;
let listStub: SinonStub;
let copyStub: SinonStub;
let headStub: SinonStub;

test.beforeEach(() => {
    deleteStub = sinon.stub(aliOSSClient, "delete");
    deleteMultiStub = sinon.stub(aliOSSClient, "deleteMulti");
    listStub = sinon.stub(aliOSSClient, "list");
    copyStub = sinon.stub(aliOSSClient, "copy");
    headStub = sinon.stub(aliOSSClient, "head");
});

test.afterEach(() => {
    deleteStub.restore();
    deleteMultiStub.restore();
    listStub.restore();
    copyStub.restore();
    headStub.restore();
});

test.serial(`${namespace} - file exists`, async ava => {
    headStub.resolves();

    const filename = v4();
    const aliOSS = new AliOSSService(ids());
    const result = await aliOSS.exists(filename);

    ava.true(result);
});

test.serial(`${namespace} - assert file exists`, async ava => {
    headStub.resolves();

    const filename = v4();
    const aliOSS = new AliOSSService(ids());
    await aliOSS.assertExists(filename);

    ava.pass();
});

test.serial(`${namespace} - file not exists`, async ava => {
    headStub.rejects(new Error("x"));

    const filename = v4();
    const aliOSS = new AliOSSService(ids());
    const result = await aliOSS.exists(filename);

    ava.false(result);
});

test.serial(`${namespace} - assert file not exists`, async ava => {
    headStub.rejects(new Error("y"));

    const filename = v4();
    const aliOSS = new AliOSSService(ids());
    await ava.throwsAsync(() => aliOSS.assertExists(filename), {
        instanceOf: FError,
        message: `${Status.Failed}: ${ErrorCode.FileNotFound}`,
    });
});

test.serial(`${namespace} - remove single file`, async ava => {
    const returnStub = sinon.stub().resolves({
        res: {
            status: "ok",
        },
    });

    deleteStub.callsFake((name: string) => returnStub(name));

    const filename = v4();
    const aliOSS = new AliOSSService(ids());
    await aliOSS.remove(filename);

    ava.true(returnStub.calledOnceWithExactly(filename));
});

test.serial(`${namespace} - remove 20 files by old`, async ava => {
    const returnStub = sinon.stub().resolves();
    deleteMultiStub.callsFake(files => returnStub(files));

    const files = Array.from({ length: 20 }, () => v4());
    const aliOSS = new AliOSSService(ids());
    await aliOSS.remove(files);

    ava.true(deleteMultiStub.calledOnceWithExactly(files));
});

test.serial(`${namespace} - remove new files`, async ava => {
    const aliOSS = new AliOSSService(ids());
    const recursiveRemoveStub = sinon.stub(aliOSS, "recursionRemove");
    const returnStub = sinon.stub().resolves();
    recursiveRemoveStub.callsFake(directory => returnStub(directory));
    deleteMultiStub.callsFake(() => Promise.resolve());

    const fileUUID = v4();
    await aliOSS.remove([`PREFIX/2021-10/12/${fileUUID}/${fileUUID}.png`]);

    ava.is(recursiveRemoveStub.getCall(0).args[0], `PREFIX/2021-10/12/${fileUUID}/`);

    recursiveRemoveStub.restore();
});

test.serial(`${namespace} - single recursion remove`, async ava => {
    const deleteReturnMultiStub = sinon.stub().resolves();
    deleteMultiStub.callsFake(files => deleteReturnMultiStub(files));

    const listReturnMultiStub = sinon.stub().resolves({
        isTruncated: false,
        objects: [
            {
                name: "/test/test.png",
            },
        ],
    });
    listStub.callsFake(() => listReturnMultiStub());

    const aliOSS = new AliOSSService(ids());
    await aliOSS.recursionRemove("/");

    ava.true(deleteMultiStub.calledOnceWithExactly(["/test/test.png"]));
});

test.serial(`${namespace} - multi recursion remove`, async ava => {
    const deleteReturnStub = sinon.stub().resolves();

    const listReturnStub = {
        objects: [
            {
                name: "/test/test.png",
            },
        ],
    };

    let isTruncated = true;
    Object.defineProperty(listReturnStub, "isTruncated", {
        get(): boolean {
            if (isTruncated) {
                isTruncated = false;
                return true;
            }

            return isTruncated;
        },
    });

    deleteMultiStub.callsFake((name: string[]) => deleteReturnStub(name));

    listStub.callsFake(() => listReturnStub);

    const aliOSS = new AliOSSService(ids());
    await aliOSS.recursionRemove("/");

    ava.deepEqual(deleteReturnStub.getCall(1).args[0], ["/test/test.png"]);
});

test.serial(`${namespace} - rename file`, async ava => {
    const returnStub = sinon.stub().resolves();

    copyStub.callsFake((filePath: string, filePath2: string, obj: any) =>
        returnStub(filePath, filePath2, obj),
    );

    const [filePath, newFileName] = [`/test/${v4()}.png`, v4()];

    const aliOSS = new AliOSSService(ids());
    await aliOSS.rename(filePath, newFileName);

    ava.deepEqual(returnStub.args[0], [
        filePath,
        filePath,
        {
            headers: {
                "Content-Disposition": `attachment; filename="${encodeURIComponent(
                    newFileName,
                )}"; filename*=UTF-8''${encodeURIComponent(newFileName)}`,
            },
        },
    ]);
});

test.serial(`${namespace} - generate policy template`, ava => {
    const [fileName, fileSize] = [`${v4()}.mp3`, 20];
    const filePath = `/${v4()}/${fileName}`;

    const aliOSS = new AliOSSService(ids());
    const { policy, signature } = aliOSS.policyTemplate(fileName, filePath, fileSize);

    ava.is(typeof signature, "string");
    const data = JSON.parse(Buffer.from(policy, "base64").toString());

    ava.is(data.conditions.length, 4);
    ava.is(data.conditions[0].bucket, StorageService.oss.bucket);
    ava.deepEqual(data.conditions[1], ["content-length-range", fileSize, fileSize]);
    ava.deepEqual(data.conditions[2], ["eq", "$key", filePath]);
    ava.deepEqual(data.conditions[3], [
        "eq",
        "$Content-Disposition",
        `attachment; filename="${encodeURIComponent(
            fileName,
        )}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    ]);
});
