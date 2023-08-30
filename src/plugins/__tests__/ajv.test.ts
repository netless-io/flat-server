import test from "ava";
import Ajv from "ajv";
import { ajvSelfPlugin } from "../Ajv";
import { v4 } from "uuid";
import { CloudStorage, OAuth, User } from "../../constants/Config";

const namespace = "[plugins][plugins-ajv]";

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

        void validate(testTimestampValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testTimestampValidSuccess = {
            timestamp: Date.now(),
        };

        void validate(testTimestampValidSuccess);

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
            fileName: `test.${CloudStorage.allowFileSuffix[0]}`,
        };

        validate(testFileSuffixValidSuccess);

        ava.is(validate.errors, null);
    }

    {
        const testFileSuffixValidSuccess = {
            fileName: `test.${CloudStorage.allowFileSuffix[0].toUpperCase()}`,
        };

        validate(testFileSuffixValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - avatar-suffix`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["fileName"],
        properties: {
            fileName: {
                type: "string",
                format: "avatar-suffix",
            },
        },
    });

    {
        const testAvatarSuffixValidFail = {
            fileName: v4(),
        };

        validate(testAvatarSuffixValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testAvatarSuffixValidSuccess = {
            fileName: `test.${User.avatar.allowSuffix[0]}`,
        };

        validate(testAvatarSuffixValidSuccess);

        ava.is(validate.errors, null);
    }

    {
        const testAvatarSuffixValidSuccess = {
            fileName: `test.${User.avatar.allowSuffix[0].toUpperCase()}`,
        };

        validate(testAvatarSuffixValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - oauth-logo-suffix`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["fileName"],
        properties: {
            fileName: {
                type: "string",
                format: "oauth-logo-suffix",
            },
        },
    });

    {
        const testOAuthLogoSuffixValidFail = {
            fileName: v4(),
        };

        validate(testOAuthLogoSuffixValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testOAuthLogoSuffixValidSuccess = {
            fileName: `test.${OAuth.logo.allowSuffix[0]}`,
        };

        validate(testOAuthLogoSuffixValidSuccess);

        ava.is(validate.errors, null);
    }

    {
        const testOAuthLogoSuffixValidSuccess = {
            fileName: `test.${OAuth.logo.allowSuffix[0].toUpperCase()}`,
        };

        validate(testOAuthLogoSuffixValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - url`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["url"],
        properties: {
            url: {
                type: "string",
                format: "url",
            },
        },
    });

    {
        const testURLValidFail = {
            url: "google.com",
        };

        validate(testURLValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testURLValidSuccess = {
            url: "http://google.com/a/1?a=1!@#$%^*()_&x=1#!c=2",
        };

        validate(testURLValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - https`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["url"],
        properties: {
            url: {
                type: "string",
                format: "https",
            },
        },
    });

    {
        const testURLValidFail = {
            url: "http://google.com",
        };

        validate(testURLValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testURLValidSuccess = {
            url: "https://google.com/a/1?a=1!@#$%^*()_&x=1#!c=2",
        };

        validate(testURLValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - phone`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["phone"],
        properties: {
            phone: {
                type: "string",
                format: "phone",
            },
        },
    });

    {
        const testPhoneValidFail = {
            phone: "+8601111111111",
        };

        validate(testPhoneValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testPhoneValidSuccess = {
            phone: "+8615555555555",
        };

        validate(testPhoneValidSuccess);

        ava.is(validate.errors, null);
    }
});

test(`${namespace} - directory-name`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["directory"],
        properties: {
            directory: {
                type: "string",
                format: "directory-name",
            },
        },
    });

    {
        const testDirectoryNameValidFail = {
            directory: "sdf/a",
        };

        validate(testDirectoryNameValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testDirectoryNameValidSuccess = {
            directory: "你好 こんにちは Enchanté Hi ",
        };

        validate(testDirectoryNameValidSuccess);

        ava.true(validate.errors === null);
    }
});

test(`${namespace} - directory-path`, ava => {
    const ajv = new Ajv();
    ajvSelfPlugin(ajv);

    const validate = ajv.compile({
        type: "object",
        required: ["directoryPath"],
        properties: {
            directoryPath: {
                type: "string",
                format: "directory-path",
            },
        },
    });

    {
        const testDirectoryPathValidFail = {
            directoryPath: "a/b/",
        };

        validate(testDirectoryPathValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testDirectoryPathValidFail = {
            directoryPath: "/a/b",
        };

        validate(testDirectoryPathValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testDirectoryPathValidFail = {
            directoryPath: "/a//b/",
        };

        validate(testDirectoryPathValidFail);

        ava.true(validate.errors !== null);
    }

    {
        const testDirectoryPathValidSuccess = {
            directoryPath: "/a/b/c/",
        };

        validate(testDirectoryPathValidSuccess);

        ava.true(validate.errors === null);
    }
});
