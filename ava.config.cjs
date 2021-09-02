const path = require("path");
const dotenv = require("dotenv-flow");

module.exports = {
    extensions: ["ts"],
    require: ["ts-node/register"],
    files: ["src/**/*.test.ts"],
    source: ["src/*.ts", "src/**/*.ts"],
    timeout: "1m",
    failFast: true,
    environmentVariables: dotenv.parse(path.resolve(__dirname, "config", ".env.test"))
};
