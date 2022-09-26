import test from "ava";
import { OSSAbstract } from "../oss-abstract";

const namespace = "v2.service-locator.service.oss-abstract";

test(`${namespace} - removeDomain`, ava => {
    {
        // @ts-ignore
        class Test extends OSSAbstract {
            public domain = "https://a.cn";
        }
        const test = new Test();

        ava.is(test.removeDomain("https://a.cn/1/2/3"), "1/2/3");
    }
    {
        // @ts-ignore
        class Test extends OSSAbstract {
            public domain = "https://a.cn";
        }
        const test = new Test();

        ava.is(test.removeDomain("https://b.cn/1/2/3"), "https://b.cn/1/2/3");
    }
});
