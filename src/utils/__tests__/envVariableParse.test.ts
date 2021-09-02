import test from "ava";
import { v4 } from "uuid";
import { EnvVariableParse } from "../EnvVariableParse";

const namespace = "[utils][utils-env-variable]";

test(`${namespace} - string variable`, ava => {
    const uuid = v4();

    const envVariable = new EnvVariableParse({
        STRING_TEST: uuid,
    });

    const result = envVariable.parse("test{{STRING_TEST}}string");

    ava.true(result.includes(uuid));
});

test(`${namespace} - function variable`, ava => {
    const uuid = v4();

    const envVariable = new EnvVariableParse({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        FUNCTION_TEST: () => uuid,
    });

    const result = envVariable.parse("test{{FUNCTION_TEST}}function");

    ava.true(result.includes(uuid));
});

test(`${namespace} - non-existent variable`, ava => {
    const uuid = v4();

    const envVariable = new EnvVariableParse({
        STRING_TEST: uuid,
    });

    const result = envVariable.parse("test{{NON_EXISTENT}}non-existent");

    ava.is(result, "testnon-existent");
});

test(`${namespace} - non variable`, ava => {
    const envVariable = new EnvVariableParse({});

    const result = envVariable.parse("test-non-variable");

    ava.is(result, "test-non-variable");
});

test(`${namespace} - auto add backslash of flag`, ava => {
    const uuid = v4();

    const envVariable = new EnvVariableParse(
        {
            BACKSLASH_TEST: uuid,
        },
        "${",
        "}",
    );

    const result = envVariable.parse("test${BACKSLASH_TEST}backslash");

    ava.true(result.includes(uuid));
});

test(`${namespace} - multiple variable`, ava => {
    const uuid1 = v4();
    const uuid2 = v4();

    const envVariable = new EnvVariableParse({
        STRING_TEST: uuid1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        FUNCTION_TEST: () => uuid2,
    });

    const result = envVariable.parse("test{{STRING_TEST}}+{{FUNCTION_TEST}}multiple-variable");

    ava.true(result.includes(uuid1));
    ava.true(result.includes(uuid2));
});
