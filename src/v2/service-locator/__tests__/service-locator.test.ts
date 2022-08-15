import test from "ava";
import { registerService, useOnceService, useService } from "../index";
import { v4 } from "uuid";
import { OSSAbstract } from "../service/oss-abstract";
import { ids } from "../../__tests__/helpers/fastify/ids";

const namespace = "v2.service-locator";

test.beforeEach(() => {
    (global as any).__SERVICE_LOCATOR = undefined;
});

test.serial(`${namespace} - not should exec when register service`, ava => {
    const returnValue = v4;
    registerService("test" as any, () => {
        ava.fail();
        return returnValue as unknown as OSSAbstract;
    });

    ava.pass();
});

test.serial(`${namespace} - fail when duplicate register same service`, ava => {
    const returnValue = v4;
    registerService("test" as any, () => {
        return returnValue as unknown as OSSAbstract;
    });

    ava.throws(
        () => {
            registerService("test" as any, () => {
                return returnValue as unknown as OSSAbstract;
            });
        },
        {
            message: "test is already registered",
        },
    );
});

test.serial(`${namespace} - request service success`, ava => {
    const returnValue = v4();
    registerService("test" as any, () => {
        return returnValue as unknown as OSSAbstract;
    });

    const oss = useService("test" as any);

    ava.is(oss, returnValue as any);
});

test.serial(`${namespace} - duplicate request service`, ava => {
    const returnValue = v4();
    registerService("test" as any, () => {
        return returnValue as unknown as OSSAbstract;
    });

    const oss = useService("test" as any);
    const oss2 = useService("test" as any);

    ava.is(oss, returnValue as any);
    ava.is(oss2, returnValue as any);
});

test.serial(`${namespace} - fail when request service not found`, ava => {
    ava.throws(
        () => {
            useService("test" as any);
        },
        {
            message: "service test is not registered",
        },
    );
});

test.serial(`${namespace} - use once service`, ava => {
    registerService("test" as any, params => {
        return params;
    });
    const id = ids();
    const svc1 = useOnceService("test" as any, id);

    const id2 = ids();
    const svc2 = useOnceService("test" as any, id2);

    ava.deepEqual(svc1, id);
    ava.deepEqual(svc2, id2);
});

test.serial(`${namespace} - fail when get once service not found`, ava => {
    ava.throws(
        () => {
            useOnceService("test" as any, {});
        },
        {
            message: "registry test is not registered",
        },
    );
});
