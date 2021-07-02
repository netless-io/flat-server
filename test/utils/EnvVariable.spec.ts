import { describe } from "mocha";
import { expect } from "chai";
import { variables } from "../../src/utils/EnvVariable";
import os from "os";
import { format } from "date-fns/fp";

describe("EnvVariable Utils", () => {
    it("test variable key number", () => {
        expect(variables).keys(["HOSTNAME", "PROJECT_DIR", "DAY_DATE"]);
    });

    it("test HOSTNAME variable", () => {
        expect(variables.HOSTNAME).eq(os.hostname());
    });

    it("test PROJECT_DIR variable", () => {
        expect(variables.PROJECT_DIR).a("string");
    });

    it("test DAY_DATE variable", () => {
        expect(variables.DAY_DATE()).eq(format("yyyy-MM-dd")(Date.now()));
    });
});
