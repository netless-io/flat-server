import test from "ava";
import { FilterValue, removeEmptyValue } from "../Object";

const namespace = "[utils][utils-object]";

test(`${namespace} - test removeEmptyValue`, ava => {
    const obj = removeEmptyValue(
        {
            number: 1,
            string: "string",
            object: {
                a: 1,
                b: null,
            },
            NaNNumber: NaN,
            emptyObject: {},
            emptyString: "",
            undefined: undefined,
            null: null,
        },
        [
            FilterValue.NAN,
            FilterValue.NULL,
            FilterValue.EMPTY_OBJECT,
            FilterValue.UNDEFINED,
            FilterValue.EMPTY_STRING,
        ],
    );

    ava.deepEqual(Object.keys(obj).sort(), ["number", "object", "string"]);
});
