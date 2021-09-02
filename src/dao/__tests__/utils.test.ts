import test from "ava";
import { noDelete } from "../Utils";

const namespace = "[dao][dao-utils][utils]";

test(`${namespace} - noDelete`, ava => {
    const result = noDelete({
        test: 1,
    });

    ava.deepEqual(result, {
        test: 1,
        is_delete: false,
    });
});
