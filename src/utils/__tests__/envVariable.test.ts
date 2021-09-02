import test from "ava";
import { variables } from "../EnvVariable";
import os from "os";
import { format } from "date-fns/fp";

const namespace = "[utils][utils-env-variable]";

test(`${namespace} - variable key number`, ava => {
    ava.deepEqual(Object.keys(variables).sort(), ["DAY_DATE", "HOSTNAME", "PROJECT_DIR"]);
});

test(`${namespace} - HOSTNAME variable`, ava => {
    ava.is(variables.HOSTNAME, os.hostname());
});

test(`${namespace} - PROJECT_DIR variable`, ava => {
    ava.is(typeof variables.PROJECT_DIR, "string");
});

test(`${namespace} - DAY_DATE variable`, ava => {
    ava.is(variables.DAY_DATE(), format("yyyy-MM-dd")(Date.now()));
});
