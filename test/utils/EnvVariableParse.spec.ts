import { describe } from "mocha";
import { expect } from "chai";
import { v4 } from "uuid";
import { EnvVariableParse } from "../../src/utils/EnvVariableParse";

describe("EnvVariableParse Utils", () => {
    it("test string variable", () => {
        const uuid = v4();

        const envVariable = new EnvVariableParse({
            STRING_TEST: uuid,
        });

        const result = envVariable.parse("test{{STRING_TEST}}string");

        expect(result).include(uuid);
    });

    it("test function variable", () => {
        const uuid = v4();

        const envVariable = new EnvVariableParse({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            FUNCTION_TEST: () => uuid,
        });

        const result = envVariable.parse("test{{FUNCTION_TEST}}function");

        expect(result).include(uuid);
    });

    it("test non-existent variable", () => {
        const uuid = v4();

        const envVariable = new EnvVariableParse({
            STRING_TEST: uuid,
        });

        const result = envVariable.parse("test{{NON_EXISTENT}}non-existent");

        expect(result).eq("testnon-existent");
    });

    it("test non variable", () => {
        const envVariable = new EnvVariableParse({});

        const result = envVariable.parse("test-non-variable");

        expect(result).eq("test-non-variable");
    });

    it("test auto add backslash of flag", () => {
        const uuid = v4();

        const envVariable = new EnvVariableParse(
            {
                BACKSLASH_TEST: uuid,
            },
            "${",
            "}",
        );

        const result = envVariable.parse("test${BACKSLASH_TEST}backslash");

        expect(result).include(uuid);
    });

    it("test multiple variable", () => {
        const uuid1 = v4();
        const uuid2 = v4();

        const envVariable = new EnvVariableParse({
            STRING_TEST: uuid1,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            FUNCTION_TEST: () => uuid2,
        });

        const result = envVariable.parse("test{{STRING_TEST}}+{{FUNCTION_TEST}}multiple-variable");

        expect(result).include(uuid1).include(uuid2);
    });
});
