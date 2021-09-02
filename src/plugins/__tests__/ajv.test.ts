import test from "ava";
import Ajv from "ajv";
import { ajvSelfPlugin } from "../Ajv";
import { v4 } from "uuid";
import { CloudStorage } from "../../constants/Process";

const namespace = "[plugins][plugins-ajv]";

test(`${namespace} - inject self plugin`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    ava.deepEqual(Object.keys(ajv.formats), ["unix-timestamp", "uuid-v4", "file-suffix"]);
});

test(`${namespace} - uuid-v4`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["uuid"],
        properties: {
            uuid: {
                type: "string",
                format: "uuid-v4",
            },
        },
    });

    {
        const testUUIDValidFail = {
            uuid: "x",
        };

        validate(testUUIDValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testUUIDValidSuccess = {
            uuid: v4(),
        };

        validate(testUUIDValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - unix-timestamp`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["timestamp"],
        properties: {
            timestamp: {
                type: "integer",
                format: "unix-timestamp",
            },
        },
    });

    {
        const testTimestampValidFail = {
            timestamp: 100000,
        };

        validate(testTimestampValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testTimestampValidSuccess = {
            timestamp: Date.now(),
        };

        validate(testTimestampValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - file-suffix`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["fileName"],
        properties: {
            fileName: {
                type: "string",
                format: "file-suffix",
            },
        },
    });

    {
        const testFileSuffixValidFail = {
            fileName: v4(),
        };

        validate(testFileSuffixValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testFileSuffixValidSuccess = {
            fileName: `test.${CloudStorage.ALLOW_FILE_SUFFIX[0]}`,
        };

        validate(testFileSuffixValidSuccess);

        ava.is(validate.errors, null);
    }
});
