import { describe } from "mocha";
import { expect } from "chai";
import { FilterValue, removeEmptyValue } from "../../src/utils/Object";

describe("Object Utils", () => {
    it("test removeEmptyValue", () => {
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

        expect(obj).keys(["number", "string", "object"]);
    });
});
