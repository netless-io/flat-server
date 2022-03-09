module.exports = {
    extensions: ["ts"],
    require: ["ts-node/register"],
    files: ["src/**/*.test.ts"],
    source: ["src/*.ts", "src/**/*.ts"],
    timeout: "1m",
    failFast: true,
    environmentVariables: {
        IS_TEST: "yes",
        NODE_ENV: "development"
    }
};
