import test from "ava";
import { parseError } from "../ParseError";
import { Method } from "axios";
import assert from "assert";

const namespace = "[logger][logger-parse-error]";

test(`${namespace} - test string error`, ava => {
    const result = parseError("test");

    ava.is(result.errorString, "test");
});

test(`${namespace} -test undefined error`, ava => {
    const result = parseError(undefined);

    ava.deepEqual(result, {});
});

test(`${namespace} - test null error`, ava => {
    const result = parseError(null);

    ava.deepEqual(result, {});
});

test(`${namespace} - test normal object error`, ava => {
    const obj = {
        a: 1,
    };

    const result = parseError(obj);

    ava.is(result.errorString, JSON.stringify(obj));
});

test(`${namespace} - test normal empty object error`, ava => {
    const obj = {};

    const result = parseError(obj);

    ava.is(result.errorString, JSON.stringify(obj));
});

test(`${namespace} - test Error object error`, ava => {
    const obj = new Error("test");

    const result = parseError(obj);

    ava.is(result.errorMessage, obj.message);
    ava.is(result.errorStack, obj.stack);
});

test(`${namespace} - test Axios Error object error`, ava => {
    const obj = {
        isAxiosError: true,
        response: {
            status: 400,
            statusText: "statusText",
            config: {
                url: "https://test",
                method: "POST" as Method,
                headers: {
                    test: "test",
                },
            },
            data: {
                a: 1,
            },
        },
    };

    const result = parseError(obj);

    assert(!!result.errorAxios, "errorAxios should exist");

    ava.is(result.errorAxios.status, obj.response.status);
    ava.is(result.errorAxios.statusText, obj.response.statusText);
    ava.is(result.errorAxios.url, obj.response.config.url);
    ava.is(result.errorAxios.method, obj.response.config.method);
    ava.is(result.errorAxios.headers, JSON.stringify(obj.response.config.headers));
    ava.is(result.errorAxios.data, JSON.stringify(obj.response.data));
});
