import test from "ava";
import { registerService, useService } from "../index";
import { v4 } from "uuid";
import { OSSAbstract } from "../service/oss-abstract";

const namespace = "v2.service-locator";

test(`${namespace} - not should exec when register service`, ava => {
    (global as any).__SERVICE_LOCATOR = undefined;
    const returnValue = v4;
    registerService("oss", () => {
        ava.fail();
        return returnValue as unknown as OSSAbstract;
    });

    ava.pass();
});

test(`${namespace} - fail when duplicate register same service`, ava => {
    (global as any).__SERVICE_LOCATOR = undefined;
    const returnValue = v4;
    registerService("oss", () => {
        return returnValue as unknown as OSSAbstract;
    });

    ava.throws(
        () => {
            registerService("oss", () => {
                return returnValue as unknown as OSSAbstract;
            });
        },
        {
            message: "oss is already registered",
        },
    );
});

test(`${namespace} - request service success`, ava => {
    (global as any).__SERVICE_LOCATOR = undefined;
    const returnValue = v4;
    registerService("oss", () => {
        return returnValue as unknown as OSSAbstract;
    });

    const oss = useService("oss");

    ava.is(oss, returnValue as any);
});

test(`${namespace} - duplicate request service`, ava => {
    (global as any).__SERVICE_LOCATOR = undefined;
    const returnValue = v4;
    registerService("oss", () => {
        return returnValue as unknown as OSSAbstract;
    });

    const oss = useService("oss");
    const oss2 = useService("oss");

    ava.is(oss, returnValue as any);
    ava.is(oss2, returnValue as any);
});

test(`${namespace} - fail when request service not found`, ava => {
    (global as any).__SERVICE_LOCATOR = undefined;
    ava.throws(
        () => {
            useService("oss2" as any);
        },
        {
            message: "Service oss2 is not registered",
        },
    );
});
