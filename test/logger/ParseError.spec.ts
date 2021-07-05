import { describe } from "mocha";
import { expect } from "chai";
import { parseError } from "../../src/logger/ParseError";

describe("logger parse error", () => {
    it("test string error", () => {
        const result = parseError("test");

        expect(result).keys(["errorString"]);
        expect(result.errorString).eq("test");
    });

    it("test undefined error", () => {
        const result = parseError(undefined);

        expect(result).empty;
    });

    it("test null error", () => {
        const result = parseError(null);

        expect(result).empty;
    });

    it("test normal object error", () => {
        const obj = {
            a: 1,
        };

        const result = parseError(obj);

        expect(result).keys(["errorString"]);
        expect(result.errorString).eq(JSON.stringify(obj));
    });

    it("test normal empty object error", () => {
        const obj = {};

        const result = parseError(obj);

        expect(result).keys(["errorString"]);
        expect(result.errorString).eq(JSON.stringify(obj));
    });

    it("test Error object error", () => {
        const obj = new Error("test");

        const result = parseError(obj);

        expect(result).keys(["errorMessage", "errorStack"]);
        expect(result.errorMessage).eq(obj.message);
        expect(result.errorStack).eq(obj.stack);
    });

    it("test Axios Error object error", () => {
        const obj = {
            isAxiosError: true,
            response: {
                status: 400,
                statusText: "statusText",
                config: {
                    url: "https://test",
                    method: "POST",
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

        expect(result).keys(["errorAxios"]);
        expect(result.errorAxios).keys([
            "status",
            "statusText",
            "url",
            "method",
            "headers",
            "data",
        ]);
        expect(result.errorAxios!.status).eq(obj.response.status);
        expect(result.errorAxios!.statusText).eq(obj.response.statusText);
        expect(result.errorAxios!.url).eq(obj.response.config.url);
        expect(result.errorAxios!.method).eq(obj.response.config.method);
        expect(result.errorAxios!.headers).eq(JSON.stringify(obj.response.config.headers));
        expect(result.errorAxios!.data).eq(JSON.stringify(obj.response.data));
    });
});
