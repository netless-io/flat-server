import test from "ava";
import sinon, { SinonStub } from "sinon";
import { aliOSSClient } from "../ali-oss-client";
import { AliOSSService } from "../ali-oss";
import { v4 } from "uuid";
import { ids } from "../../../__tests__/helpers/fastify/ids";

const namespace = "v2.services.oss.ali-oss";

let deleteStub: SinonStub;
let deleteMultiStub: SinonStub;
let listStub: SinonStub;

test.beforeEach(() => {
    deleteStub = sinon.stub(aliOSSClient, "delete");
    deleteMultiStub = sinon.stub(aliOSSClient, "deleteMulti");
    listStub = sinon.stub(aliOSSClient, "list");
});

test.afterEach(() => {
    deleteStub.restore();
    deleteMultiStub.restore();
    listStub.restore();
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
